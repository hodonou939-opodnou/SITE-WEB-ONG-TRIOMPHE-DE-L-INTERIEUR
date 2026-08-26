import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion, Admin",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist-100 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-ink/8 bg-mist-50 p-8 shadow-sm">
        <h1 className="font-display text-2xl text-leaf-900">Espace admin</h1>
        <p className="mt-1 text-sm text-ink/60">ONG Triomphe de l&apos;Intérieur</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
