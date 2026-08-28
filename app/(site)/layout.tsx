import { ReactNode, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegistrationPopup from "@/components/RegistrationPopup";
import { getLogoSrc } from "@/lib/media";

export default function SiteLayout({ children }: { children: ReactNode }) {
  const logoSrc = getLogoSrc();

  return (
    <>
      <Header logoSrc={logoSrc} />
      <main className="flex-1">{children}</main>
      <Footer logoSrc={logoSrc} />
      <Suspense fallback={null}>
        <RegistrationPopup />
      </Suspense>
    </>
  );
}
