import { brevo, cigibm } from "@/lib/content";

export default function RegistrationForm({ id }: { id?: string }) {
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
        action={brevo.formAction}
        method="POST"
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor="reg-firstname"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist-100/60"
          >
            Prénom & nom
          </label>
          <input
            id="reg-firstname"
            name={brevo.fields.firstName}
            type="text"
            required
            autoComplete="name"
            className={inputClass}
            placeholder="Votre nom complet"
          />
        </div>

        <div>
          <label
            htmlFor="reg-phone"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist-100/60"
          >
            Téléphone (WhatsApp de préférence)
          </label>
          <input
            id="reg-phone"
            name={brevo.fields.phone}
            type="tel"
            required
            autoComplete="tel"
            className={inputClass}
            placeholder="+229 ..."
          />
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist-100/60"
          >
            Email
          </label>
          <input
            id="reg-email"
            name={brevo.fields.email}
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="vous@exemple.com"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-azure-500 px-6 py-4 text-base font-semibold tracking-wide text-mist-50 shadow-lg shadow-azure-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-azure-600 hover:shadow-xl"
        >
          Je réserve ma place gratuite →
        </button>

        <p className="text-center text-xs leading-relaxed text-mist-100/50">
          Vos coordonnées servent uniquement à votre inscription au congrès.
          Aucune donnée n&apos;est partagée.
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
