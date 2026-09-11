"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const PRESET_AMOUNTS = [1000, 5000, 10000, 20000, 50000, 100000];
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 2_000_000;
// Feexpay accepte la demande (status: PENDING) avant même que le donateur
// ait confirmé sur son téléphone — voir le commentaire plus bas sur
// pollStatus(). Au-delà de cette fenêtre sans résolution, on arrête de
// solliciter l'API et on laisse la main au donateur plutôt que de
// continuer indéfiniment.
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90_000;

// Pays et opérateurs réellement pris en charge par Feexpay pour un
// paiement Mobile Money (vérifié dans docs.feexpay.me > API > Payin, pas
// deviné) — voir la correspondance exacte vers les réseaux Feexpay dans
// lib/feexpay.ts (OPERATOR_TO_NETWORK), ces libellés doivent rester
// identiques des deux côtés.
const COUNTRIES = [
  { code: "BJ", label: "Bénin", dialCode: "+229", operators: ["MTN", "Moov", "Celtiis", "Coris"] },
  { code: "TG", label: "Togo", dialCode: "+228", operators: ["Togocom", "Moov"] },
  { code: "CI", label: "Côte d'Ivoire", dialCode: "+225", operators: ["MTN", "Moov", "Wave", "Orange"] },
];

function formatXof(amount: number) {
  return `${amount.toLocaleString("fr-FR")} XOF`;
}

type Phase = "form" | "otp" | "waiting" | "success" | "failed";

export default function DonationForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(5000);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [countryCode, setCountryCode] = useState("BJ");
  const [operator, setOperator] = useState<string | null>("MTN");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [waitingTimedOut, setWaitingTimedOut] = useState(false);
  // Coris (Bénin) seulement : un code reçu par SMS à renvoyer pour valider
  // la transaction — voir lib/feexpay.ts (isOtpNetwork).
  const [otp, setOtp] = useState("");

  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];
  const amount = isCustom ? Number(customAmount) : selectedAmount;

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => stopPolling, []);

  // Feexpay accepte le requesttopay (status: PENDING) avant que le donateur
  // ait confirmé quoi que ce soit sur son téléphone (USSD ou notification).
  // Afficher "Merci" à ce stade, comme le faisait une version précédente de
  // ce composant, annonçait un succès qui n'avait pas encore eu lieu — le
  // paiement peut encore être refusé après coup (mauvais code, solde
  // insuffisant, annulation). On interroge donc le vrai statut jusqu'à une
  // résolution réelle (ou l'expiration du délai) avant d'afficher quoi que
  // ce soit de définitif.
  function pollStatus(reference: string) {
    pollStartRef.current = Date.now();
    setWaitingTimedOut(false);
    stopPolling();
    pollRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        stopPolling();
        setWaitingTimedOut(true);
        return;
      }
      try {
        const res = await fetch(`/api/donate/status?reference=${encodeURIComponent(reference)}`);
        const json = await res.json().catch(() => null);
        if (!res.ok) return; // Panne transitoire : on retentera au prochain tick.
        if (json.status === "SUCCESSFUL") {
          stopPolling();
          setPhase("success");
        } else if (json.status === "FAILED") {
          stopPolling();
          setFailReason(json.reason ?? null);
          setPhase("failed");
        }
      } catch {
        // Panne réseau transitoire : ignorée, on retente au prochain tick.
      }
    }, POLL_INTERVAL_MS);
  }

  async function submitPayment(otpValue?: string) {
    const res = await fetch("/api/donate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        countryCode: country.code,
        dialCode: country.dialCode,
        operator,
        phone,
        otp: otpValue,
      }),
    });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setError(json?.error ?? "Le paiement n'a pas pu être initié. Merci de réessayer.");
      return;
    }

    if (json.paymentUrl) {
      // Moov/Wave/Orange Côte d'Ivoire : pas de push vers le téléphone,
      // le donateur paie sur une page dédiée.
      window.location.href = json.paymentUrl;
      return;
    }

    if (json.requiresOtp) {
      setPhase("otp");
      return;
    }

    setPhase("waiting");
    pollStatus(json.reference);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!amount || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      setError(`Choisissez un montant entre ${formatXof(MIN_AMOUNT)} et ${formatXof(MAX_AMOUNT)}.`);
      return;
    }
    if (!phone.trim()) {
      setError("Un numéro de téléphone est nécessaire pour valider le paiement Mobile Money.");
      return;
    }

    setSubmitting(true);
    try {
      await submitPayment();
    } catch {
      setError("Connexion interrompue. Vérifiez votre connexion et réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!otp.trim()) {
      setError("Entrez le code reçu par SMS.");
      return;
    }
    setSubmitting(true);
    try {
      await submitPayment(otp);
    } catch {
      setError("Connexion interrompue. Vérifiez votre connexion et réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetToForm() {
    setPhase("form");
    setError(null);
    setFailReason(null);
    setWaitingTimedOut(false);
    setOtp("");
  }

  if (phase === "success") {
    return (
      <div className="rounded-2xl border border-leaf-600/20 bg-leaf-50 p-8 text-center">
        <p className="font-display text-xl text-leaf-900">Merci. Votre don est confirmé.</p>
        <p className="mt-2 text-sm text-ink/70">Votre don de {formatXof(amount ?? 0)} a bien été reçu.</p>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="rounded-2xl border border-ink/8 bg-mist-50 p-8 text-center">
        <p className="font-display text-xl text-leaf-900">Le paiement n&apos;a pas abouti.</p>
        <p className="mt-2 text-sm text-ink/70">
          {failReason || "Le paiement a été refusé ou annulé. Vérifiez votre solde ou réessayez."}
        </p>
        <button
          type="button"
          onClick={resetToForm}
          className="mt-5 rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-mist-50 transition-colors hover:bg-leaf-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className="rounded-2xl border border-ink/8 bg-mist-50 p-8 text-center">
        <p className="font-display text-xl text-leaf-900">Confirmez sur votre téléphone.</p>
        <p className="mt-2 text-sm text-ink/70">
          Une notification ou un code USSD vient de vous être envoyé pour valider votre don de {formatXof(amount ?? 0)}.
          Cette page se met à jour automatiquement dès que c&apos;est confirmé.
        </p>
        {!waitingTimedOut ? (
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-ink/50">
            <span className="h-2 w-2 animate-pulse rounded-full bg-leaf-600" />
            En attente de confirmation...
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-ink/70">
              Nous n&apos;avons pas encore reçu de confirmation. Vérifiez votre téléphone, ou réessayez.
            </p>
            <button
              type="button"
              onClick={resetToForm}
              className="mt-4 rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              Réessayer
            </button>
          </>
        )}
      </div>
    );
  }

  if (phase === "otp") {
    return (
      <form onSubmit={handleOtpSubmit} className="rounded-2xl border border-ink/8 bg-mist-50 p-6 sm:p-8">
        <p className="font-display text-xl text-leaf-900">Un code vous a été envoyé par SMS.</p>
        <p className="mt-2 text-sm text-ink/70">Entrez-le ci-dessous pour valider votre don de {formatXof(amount ?? 0)}.</p>
        <input
          type="text"
          inputMode="numeric"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Code reçu par SMS"
          className="mt-4 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm"
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-full bg-leaf-600 py-4 text-base font-semibold text-mist-50 transition-colors hover:bg-leaf-700 disabled:opacity-60"
        >
          {submitting ? "Validation..." : "Valider le code"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-ink/8 bg-mist-50 p-6 sm:p-8">
      <p className="font-display text-xl text-leaf-900 sm:text-2xl">
        Chaque don finance une place gratuite au CIGIBM.
      </p>
      <p className="mt-2 text-sm text-ink/70">Combien pouvez-vous offrir aujourd&apos;hui ?</p>

      <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setIsCustom(false);
              setSelectedAmount(preset);
            }}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
              !isCustom && selectedAmount === preset
                ? "border-leaf-600 bg-leaf-600 text-mist-50"
                : "border-ink/12 bg-white text-ink hover:border-leaf-600/40"
            }`}
          >
            {preset.toLocaleString("fr-FR")}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIsCustom(true)}
          className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
            isCustom ? "border-leaf-600 bg-leaf-600 text-mist-50" : "border-ink/12 bg-white text-ink hover:border-leaf-600/40"
          }`}
        >
          Autre
        </button>
      </div>

      {isCustom && (
        <div className="mt-3">
          <input
            type="number"
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            inputMode="numeric"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Montant en XOF"
            className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm"
          />
        </div>
      )}

      <div className="mt-6">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Pays</label>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCountryCode(c.code);
                setOperator(c.operators[0] ?? null);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                countryCode === c.code
                  ? "border-leaf-600 bg-leaf-600 text-mist-50"
                  : "border-ink/12 bg-white text-ink hover:border-leaf-600/40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Opérateur</label>
        <div className="flex flex-wrap gap-2">
          {country.operators.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setOperator(op)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                operator === op
                  ? "border-leaf-600 bg-leaf-600 text-mist-50"
                  : "border-ink/12 bg-white text-ink hover:border-leaf-600/40"
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Numéro de téléphone Mobile Money
        </label>
        <div className="flex overflow-hidden rounded-xl border border-ink/15 bg-white">
          <span className="flex items-center bg-ink/5 px-3 text-sm text-ink/60">{country.dialCode}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="XX XX XX XX"
            className="w-full px-4 py-3 text-sm outline-none"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-leaf-600 py-4 text-base font-semibold text-mist-50 transition-colors hover:bg-leaf-700 disabled:opacity-60"
      >
        {submitting ? "Envoi en cours..." : `Faire ce don de ${formatXof(amount ?? 0)} maintenant`}
      </button>
      <p className="mt-3 text-center text-xs text-ink/50">
        Paiement sécurisé par Mobile Money. Vous confirmez directement depuis votre téléphone.
      </p>
    </form>
  );
}
