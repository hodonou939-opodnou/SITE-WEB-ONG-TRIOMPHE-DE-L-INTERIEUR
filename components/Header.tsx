"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Container from "./Container";
import Button from "./Button";
import { navigation, siteConfig } from "@/lib/content";

export default function Header({ logoSrc }: { logoSrc: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-mist-100/90 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          {logoSrc ? (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm shadow-ink/10">
              <Image
                src={logoSrc}
                alt={siteConfig.shortName}
                width={112}
                height={112}
                className="h-full w-full object-contain p-1"
                priority
              />
            </span>
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-azure-800 font-display text-lg text-mist-50">
                TI
              </span>
              <span className="font-display text-lg leading-tight text-azure-900">
                {siteConfig.shortName}
              </span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  active ? "text-leaf-600" : "text-ink/70 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <Button href="/nous-soutenir" variant="primary" className="!px-5 !py-2.5">
            Nous soutenir
          </Button>
        </div>

        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5 text-ink"
          >
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-ink/8 lg:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-3 text-sm font-medium ${
                    pathname === item.href
                      ? "bg-leaf-50 text-leaf-600"
                      : "text-ink/70"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 px-3">
                <Button href="/nous-soutenir" variant="primary" className="w-full">
                  Nous soutenir
                </Button>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
