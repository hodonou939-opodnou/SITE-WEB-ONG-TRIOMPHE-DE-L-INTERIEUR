import type { Metadata } from "next";
import { requireScanAccess } from "@/lib/admin/auth";
import ScannerClient from "./ScannerClient";

export const metadata: Metadata = {
  title: "Scanner, Admin",
  robots: { index: false },
};

export default async function ScanPage() {
  const session = await requireScanAccess();

  return (
    <div className="flex min-h-screen flex-col bg-leaf-950 px-4 py-6 text-mist-50">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-leaf-300">
        Connecté(e) en tant que {session.fullName}
      </p>
      <h1 className="mt-2 text-center font-display text-2xl">Scanner d&apos;entrée CIGIBM</h1>
      <ScannerClient />
    </div>
  );
}
