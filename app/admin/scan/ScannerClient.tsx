"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import jsQR from "jsqr";
import { checkInAction, checkInByIdAction, searchParticipantsAction } from "./actions";
import type { CheckInResult, ParticipantMatch } from "@/lib/checkin/checkin";

type ScanState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "result"; result: CheckInResult }
  | { kind: "error"; message: string };

// Résultat de la dernière recherche *complétée*, gardé avec la requête à
// laquelle il correspond. L'état "en cours de recherche" n'est pas stocké :
// il se déduit au rendu en comparant `searchQuery` à `outcome.query` (voir
// `outcomeForQuery` plus bas), pour ne jamais appeler setState de façon
// synchrone depuis l'effet de recherche.
type SearchOutcome =
  | { query: string; kind: "results"; matches: ParticipantMatch[] }
  | { query: string; kind: "error" };

const CHECKIN_FAILURE_MESSAGE = "Échec de la vérification. Vérifiez la connexion et réessayez.";
const SEARCH_DEBOUNCE_MS = 300;

export default function ScannerClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastSubmittedToken = useRef<string | null>(null);
  // Incrémenté à chaque recherche réellement envoyée au serveur ; permet
  // d'ignorer la réponse d'une requête devenue obsolète (une frappe plus
  // récente a déjà déclenché une nouvelle recherche).
  const searchRequestId = useRef(0);
  // Miroir de `state.kind`, lu par `submitToken`. `submitToken` doit rester
  // sans dépendances (voir l'effet caméra, `[submitToken]` : le faire
  // dépendre de `state` relancerait getUserMedia() à chaque check-in et
  // ferait clignoter le flux vidéo) mais doit quand même savoir si un scan
  // est déjà en cours ou un panneau affiché, pour ne pas écraser un résultat
  // encore non acquitté par l'agent avec celui d'un badge suivant.
  const stateKindRef = useRef<ScanState["kind"]>("idle");

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOutcome, setSearchOutcome] = useState<SearchOutcome | null>(null);

  // Seul point d'écriture de `state` : garde `stateKindRef` synchronisé sans
  // effet séparé (donc sans décalage d'une frame entre le rendu et le ref).
  const applyState = useCallback((next: ScanState) => {
    stateKindRef.current = next.kind;
    setState(next);
  }, []);

  const submitToken = useCallback(async (token: string) => {
    if (!token) return;
    // Un résultat, une erreur ou une vérification en cours occupe déjà
    // l'écran : un badge qui dérive dans le cadre ne doit ni relancer un
    // check-in concurrent, ni écraser silencieusement ce qui est affiché
    // avant que l'agent n'ait acquitté ("Scanner suivant"/"Réessayer").
    if (stateKindRef.current !== "idle") return;
    if (lastSubmittedToken.current === token) return;
    lastSubmittedToken.current = token;
    applyState({ kind: "checking" });
    try {
      const result = await checkInAction(token);
      applyState({ kind: "result", result });
    } catch (err) {
      // Une redirection interne à Next.js (ex. session admin expirée pendant
      // l'événement -> /admin/login) doit continuer sa route normale : elle
      // ne doit pas être avalée et affichée comme une simple erreur réseau.
      unstable_rethrow(err);
      console.error("Échec du check-in par jeton", err);
      // On relâche le verrou anti-doublon : sans ça, un badge dont la
      // vérification a échoué une fois ne pourrait plus jamais être
      // re-scanné sans recharger la page. Le badge ne sera cependant
      // re-décodé qu'après "Réessayer" (retour à idle), pas pendant que
      // l'erreur est affichée — voir le garde-fou stateKindRef ci-dessus.
      lastSubmittedToken.current = null;
      applyState({ kind: "error", message: CHECKIN_FAILURE_MESSAGE });
    }
  }, [applyState]);

  // Check-in déclenché par un résultat de recherche (secours manuel) plutôt
  // que par le scan caméra — même logique de résultat/erreur. Gardé sur
  // `state.kind` (pas seulement "checking") : tant qu'un résultat ou une
  // erreur est affiché, un second tap ne doit pas relancer de check-in.
  const submitParticipant = useCallback(
    async (participant: ParticipantMatch) => {
      if (state.kind !== "idle") return;
      applyState({ kind: "checking" });
      try {
        const result = await checkInByIdAction(participant.id);
        applyState({ kind: "result", result });
      } catch (err) {
        unstable_rethrow(err);
        console.error("Échec du check-in par recherche", err);
        applyState({ kind: "error", message: CHECKIN_FAILURE_MESSAGE });
      }
    },
    [state.kind, applyState],
  );

  // Après un résultat affiché, on autorise à nouveau le même jeton (au cas
  // où le même visiteur reviendrait volontairement se faire re-scanner) une
  // fois que l'agent a repris un nouveau scan. On réinitialise aussi la
  // recherche : la transaction précédente est terminée, la prochaine repart
  // d'une recherche vierge.
  const resetForNextScan = useCallback(() => {
    lastSubmittedToken.current = null;
    applyState({ kind: "idle" });
    setSearchQuery("");
    setSearchOutcome(null);
  }, [applyState]);

  // Dismiss d'un échec de vérification : relâche le verrou de jeton (pour
  // permettre un nouveau scan du même badge) sans toucher à la recherche en
  // cours, pour pouvoir retaper immédiatement sur le même résultat.
  const dismissError = useCallback(() => {
    lastSubmittedToken.current = null;
    applyState({ kind: "idle" });
  }, [applyState]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    // Si l'agent quitte la page pendant que la boîte de dialogue de
    // permission caméra est encore ouverte, le nettoyage de cet effet
    // s'exécute avant que getUserMedia() ne se résolve — stream et
    // rafRef.current valent encore null à ce moment-là. Ce drapeau, capturé
    // par la closure, permet de le détecter quand la promesse se résout plus
    // tard et d'arrêter net (piste caméra coupée, boucle jamais démarrée).
    let cancelled = false;

    async function startCamera() {
      try {
        const acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) {
          acquired.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = acquired;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (cancelled) return;
        scanLoop();
      } catch (err) {
        if (cancelled) return;
        console.error("Camera access failed", err);
        setCameraError("Impossible d'accéder à la caméra. Utilisez la recherche ci-dessous.");
      }
    }

    function scanLoop() {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height);
      if (decoded?.data) {
        void submitToken(decoded.data);
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    }

    startCamera();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [submitToken]);

  // Recherche par nom/téléphone au fil de la frappe, avec un anti-rebond de
  // ~300 ms — une file d'attente à la porte ne doit pas dépendre d'un tap
  // supplémentaire sur un bouton "Rechercher". En dessous de 2 caractères, on
  // ne programme rien : l'affichage "vide" se déduit au rendu (showSearchPanel).
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return;

    const timer = setTimeout(() => {
      const requestId = ++searchRequestId.current;
      searchParticipantsAction(query)
        .then((matches) => {
          if (searchRequestId.current !== requestId) return; // réponse obsolète
          setSearchOutcome({ query, kind: "results", matches });
        })
        .catch((err) => {
          unstable_rethrow(err);
          if (searchRequestId.current !== requestId) return;
          console.error("Échec de la recherche de participants", err);
          setSearchOutcome({ query, kind: "error" });
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const trimmedQuery = searchQuery.trim();
  const showSearchPanel = trimmedQuery.length >= 2;
  // N'affiche le résultat mémorisé que s'il correspond à la requête actuelle
  // — sinon une recherche précédente encore visible tromperait l'agent
  // pendant que la nouvelle est en cours (debounce ou requête en vol).
  const outcomeForQuery = searchOutcome?.query === trimmedQuery ? searchOutcome : null;

  return (
    <div className="mx-auto mt-6 flex w-full max-w-sm flex-1 flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-mist-50/15 bg-black">
        <video ref={videoRef} className="w-full" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {cameraError && <p className="text-sm text-red-300">{cameraError}</p>}

      <div className="flex flex-col gap-2">
        <label htmlFor="participant-search" className="text-xs font-semibold uppercase tracking-wide text-mist-50/60">
          Secours manuel : recherche par nom ou téléphone
        </label>
        <input
          id="participant-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Nom ou numéro de téléphone"
          className="min-w-0 rounded-xl border border-mist-50/20 bg-mist-50/5 px-3 py-2 text-sm text-mist-50 outline-none placeholder:text-mist-50/40"
        />

        {showSearchPanel && (
          <div className="flex flex-col gap-2">
            {!outcomeForQuery && <p className="text-center text-sm text-mist-50/70">Recherche…</p>}
            {outcomeForQuery?.kind === "error" && (
              <p className="text-sm text-red-300">La recherche a échoué. Vérifiez la connexion et réessayez.</p>
            )}
            {outcomeForQuery?.kind === "results" && outcomeForQuery.matches.length === 0 && (
              <p className="text-sm text-mist-50/60">Aucun résultat.</p>
            )}
            {outcomeForQuery?.kind === "results" &&
              outcomeForQuery.matches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  disabled={state.kind !== "idle"}
                  onClick={() => void submitParticipant(match)}
                  className="flex flex-col items-start gap-1 rounded-xl border border-mist-50/15 bg-mist-50/5 px-3 py-2 text-left text-sm text-mist-50 disabled:opacity-50"
                >
                  <span className="font-semibold">{match.fullName}</span>
                  <span className="text-mist-50/60">{match.phone}</span>
                  {match.attendedAt && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                      Déjà enregistré(e) à {match.attendedAt.toLocaleTimeString("fr-FR")}
                    </span>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>

      {state.kind === "checking" && <p className="text-center text-sm text-mist-50/70">Vérification…</p>}

      {state.kind === "error" && (
        <div className="rounded-2xl bg-red-500/20 p-5 text-center text-red-200">
          <p className="font-semibold">{state.message}</p>
          <button
            type="button"
            onClick={dismissError}
            className="mt-4 rounded-full border border-current px-5 py-2 text-sm font-semibold"
          >
            Réessayer
          </button>
        </div>
      )}

      {state.kind === "result" && (
        <div
          className={`rounded-2xl p-5 text-center ${
            state.result.status === "success"
              ? "bg-leaf-500/20 text-leaf-200"
              : state.result.status === "already"
                ? "bg-amber-500/20 text-amber-200"
                : "bg-red-500/20 text-red-200"
          }`}
        >
          {state.result.status === "not_found" && <p className="font-semibold">Billet invalide</p>}
          {state.result.status === "already" && (
            <>
              <p className="font-semibold">{state.result.fullName}</p>
              <p className="mt-1 text-sm">Déjà enregistré(e) à {state.result.attendedAt.toLocaleTimeString("fr-FR")}</p>
            </>
          )}
          {state.result.status === "success" && (
            <>
              <p className="font-semibold">{state.result.fullName}</p>
              <p className="mt-1 text-sm">Enregistré(e) avec succès</p>
            </>
          )}
          <button
            type="button"
            onClick={resetForNextScan}
            className="mt-4 rounded-full border border-current px-5 py-2 text-sm font-semibold"
          >
            Scanner suivant
          </button>
        </div>
      )}
    </div>
  );
}
