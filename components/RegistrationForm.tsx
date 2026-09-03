import { cigibm } from "@/lib/content";

// idPrefix : ce formulaire apparaît désormais à deux endroits sur
// /cigibm-2026 (hero + après la section "Ce que comprend votre place").
// Sans préfixe distinct, les deux instances généreraient des id="reg-*"
// dupliqués — HTML invalide, associations label/input cassées pour l'un
// des deux exemplaires.
export default function RegistrationForm({ id, idPrefix = "reg" }: { id?: string; idPrefix?: string }) {
  const phones = cigibm.nextEdition.registrationPhones;
  const inputClass =
    "w-full rounded-xl border border-mist-50/20 bg-mist-50/10 px-4 py-3.5 text-sm text-mist-50 placeholder:text-mist-100/40 outline-none transition-colors focus:border-azure-400 focus:bg-mist-50/15";

  return (
    <div id={id} className="rounded-3xl border border-mist-50/12 bg-leaf-900/60 p-6 backdrop-blur sm:p-8">
      <h3 className="font-display text-2xl leading-snug text-mist-50">
        Réservez votre place
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-mist-100/70">
        Participation gratuite. Renseignez vos coordonnées : nous vous envoyons
        votre confirmation et le programme détaillé.
      </p>

      <form
        action="/api/cigibm-register"
        method="POST"
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor={`${idPrefix}-firstname`}
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist-100/60"
          >
            Prénom & nom
          </label>
          <input
            id={`${idPrefix}-firstname`}
            name="name"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
            placeholder="Votre nom complet"
          />
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-phone`}
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist-100/60"
          >
            Téléphone (WhatsApp de préférence)
          </label>
          <input
            id={`${idPrefix}-phone`}
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
            htmlFor={`${idPrefix}-email`}
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist-100/60"
          >
            Email
          </label>
          <input
            id={`${idPrefix}-email`}
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
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-azure-500"
          />
          <span className="text-xs leading-relaxed text-mist-100/70">
            J&apos;accepte de recevoir par email et par téléphone les
            informations liées à mon inscription au CIGIBM 2026 et aux
            activités de l&apos;ONG. Je peux me désinscrire à tout moment.
          </span>
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-azure-500 px-6 py-4 text-base font-semibold tracking-wide text-mist-50 shadow-lg shadow-azure-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-azure-600 hover:shadow-xl"
        >
          Je réserve ma place gratuite
        </button>

        <p className="text-center text-xs leading-relaxed text-mist-100/50">
          Vos coordonnées servent uniquement à votre inscription au congrès.
          Elles ne sont ni vendues, ni partagées avec des tiers.
        </p>
      </form>

      <div className="mt-6 border-t border-mist-50/12 pt-5 text-center">
        <p className="text-xs text-mist-100/60">
          Vous préférez vous inscrire de vive voix ?
        </p>
        <div className="mt-2 flex flex-col items-center gap-1.5">
          {phones.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="text-sm font-semibold text-leaf-300 underline underline-offset-4 transition-colors hover:text-leaf-200"
            >
              {phone}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
