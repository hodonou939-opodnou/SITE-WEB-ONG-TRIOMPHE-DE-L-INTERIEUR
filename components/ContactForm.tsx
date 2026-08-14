"use client";

import { FormEvent } from "react";
import { siteConfig } from "@/lib/content";

export default function ContactForm() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get("name")?.toString() ?? "";
    const email = data.get("email")?.toString() ?? "";
    const subject = data.get("subject")?.toString() || "Message depuis le site";
    const message = data.get("message")?.toString() ?? "";

    const body = `Nom : ${name}\nEmail : ${email}\n\n${message}`;
    window.location.href = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  const inputClass =
    "w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm text-ink placeholder:text-ink/40 outline-none transition-colors focus:border-leaf-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
            Nom complet
          </label>
          <input id="name" name="name" type="text" required className={inputClass} placeholder="Votre nom" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClass} placeholder="vous@exemple.com" />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Sujet
        </label>
        <input id="subject" name="subject" type="text" className={inputClass} placeholder="Don, bénévolat, presse..." />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={inputClass}
          placeholder="Votre message"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-leaf-600 px-6 py-3 text-sm font-medium tracking-wide text-mist-50 shadow-sm shadow-leaf-900/10 transition-colors hover:bg-leaf-700"
      >
        Envoyer le message
      </button>
    </form>
  );
}
