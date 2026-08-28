export default function AmbassadorSignupForm() {
  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-mist-50 px-4 py-3.5 text-sm text-leaf-950 placeholder:text-ink/35 outline-none transition-colors focus:border-leaf-400";

  return (
    <div className="rounded-3xl border border-ink/8 bg-mist-50 p-6 sm:p-8">
      <h3 className="font-display text-2xl leading-snug text-leaf-900">
        Devenir ambassadeur ou ambassadrice
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">
        Créez votre lien personnel en une minute. Nous vous l&apos;envoyons
        par email dès que votre compte est validé par notre équipe.
      </p>

      <form action="/api/ambassador-signup" method="POST" className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="amb-fullname"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/50"
          >
            Prénom & nom
          </label>
          <input
            id="amb-fullname"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
            placeholder="Votre nom complet"
          />
        </div>

        <div>
          <label
            htmlFor="amb-phone"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/50"
          >
            Téléphone (WhatsApp de préférence)
          </label>
          <input
            id="amb-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className={inputClass}
            placeholder="+229 ..."
          />
        </div>

        <div>
          <label
            htmlFor="amb-email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/50"
          >
            Email
          </label>
          <input
            id="amb-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="vous@exemple.com"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 pt-1">
          <input
            type="checkbox"
            name="consent"
            value="1"
            required
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-leaf-500"
          />
          <span className="text-xs leading-relaxed text-ink/60">
            J&apos;accepte que mon nom et ma photo (si j&apos;en fournis une)
            apparaissent publiquement sur le site une fois mon compte
            ambassadeur validé.
          </span>
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-leaf-600 px-6 py-4 text-base font-semibold tracking-wide text-mist-50 shadow-lg shadow-leaf-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-leaf-700 hover:shadow-xl"
        >
          Créer mon lien d&apos;ambassadeur
        </button>
      </form>
    </div>
  );
}
