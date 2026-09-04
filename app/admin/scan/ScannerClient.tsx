"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { checkInAction } from "./actions";
import type { CheckInResult } from "@/lib/checkin/checkin";

type ScanState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "result"; result: CheckInResult };

export default function ScannerClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastSubmittedToken = useRef<string | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [manualToken, setManualToken] = useState("");

  const submitToken = useCallback(async (token: string) => {
    if (!token || lastSubmittedToken.current === token) return;
    lastSubmittedToken.current = token;
    setState({ kind: "checking" });
    const result = await checkInAction(token);
    setState({ kind: "result", result });
  }, []);

  // Après un résultat affiché, on autorise à nouveau le même jeton (au cas
  // où le même visiteur reviendrait volontairement se faire re-scanner) une
  // fois que l'agent a repris un nouveau scan.
  const resetForNextScan = useCallback(() => {
    lastSubmittedToken.current = null;
    setState({ kind: "idle" });
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scanLoop();
      } catch (err) {
        console.error("Camera access failed", err);
        setCameraError("Impossible d'accéder à la caméra. Utilisez la saisie manuelle ci-dessous.");
      }
    }

    function scanLoop() {
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [submitToken]);

  return (
    <div className="mx-auto mt-6 flex w-full max-w-sm flex-1 flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-mist-50/15 bg-black">
        <video ref={videoRef} className="w-full" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {cameraError && <p className="text-sm text-red-300">{cameraError}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submitToken(manualToken.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          placeholder="Saisie manuelle du jeton"
          className="min-w-0 flex-1 rounded-xl border border-mist-50/20 bg-mist-50/5 px-3 py-2 text-sm text-mist-50 outline-none placeholder:text-mist-50/40"
        />
        <button type="submit" className="rounded-xl bg-leaf-500 px-4 py-2 text-sm font-semibold text-leaf-950">
          Valider
        </button>
      </form>

      {state.kind === "checking" && <p className="text-center text-sm text-mist-50/70">Vérification…</p>}

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
