"use client";

import { useState, type FormEvent } from "react";

const PRESET_AMOUNTS = [1000, 5000, 10000, 20000, 50000, 100000];

// Bénin uniquement pour l'instant : les opérateurs affichés (MTN, Moov,
// Celtiis) sont ceux réellement disponibles au Bénin. Togo et Côte d'Ivoire
// restent sélectionnables pour ne pas fermer la porte à un don depuis ces
// pays, mais leurs propres opérateurs Mobile Money n'ont pas été confirmés
// avec l'ONG — à corriger avant un vrai lancement dans ces pays plutôt que
// de deviner des noms d'opérateurs qui pourraient être faux.
const COUNTRIES = [
  { code: "BJ", label: "Bénin", dialCode: "+229", operators: ["MTN", "Moov", "Celtiis"] },
  { code: "TG", label: "Togo", dialCode: "+228", operators: [] as string[] },
  { code: "CI", label: "Côte d'Ivoire", dialCode: "+225", operators: [] as string[] },
];

function formatXof(amount: number) {
  return `${amount.toLocaleString("fr-FR")} XOF`;
}

export default function DonationForm() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(5000);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [countryCode, setCountryCode] = useState("BJ");
  const [operator, setOperator] = useState<string | null>("MTN");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];
  const amount = isCustom ? Number(customAmount) : selectedAmount;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!amount || amount <= 0) {
      setError("Choisissez un montant, ou entrez-en un vous-même.");
      return;
    }
    if (!phone.trim()) {
      setError("Un numéro de téléphone est nécessaire pour valider le paiement Mobile Money.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          countryCode: country.code,
          dialCode: country.dialCode,
          operator,
          phone,
        }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error ?? "Le paiement n'a pas pu être initié. Merci de réessayer.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Connexion interrompue. Vérifiez votre connexion et réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-leaf-600/20 bg-leaf-50 p-8 text-center">
        <p className="font-display text-xl text-leaf-900">Merci. Votre don compte déjà.</p>
        <p className="mt-2 text-sm text-ink/70">
          Confirmez le paiement depuis la notification envoyée sur votre téléphone pour finaliser votre don de{" "}
          {formatXof(amount ?? 0)}.
        </p>
      </div>
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
            min={100}
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

      {country.operators.length > 0 && (
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
      )}

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
