"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PainelSwitcher from "@/components/PainelSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

export default function CustomerHeader({
  nomeRestaurante = "Dashi Sushi",
  slug,
  souDona = false,
}: {
  nomeRestaurante?: string;
  slug?: string;
  /** A própria dona vendo o cardápio como cliente veria — mostra o atalho
   * pra trocar de painel sem precisar deslogar. */
  souDona?: boolean;
}) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 shadow-sm md:px-6">
      <Link href="/" className="flex min-w-0 items-center gap-2.5">
        <span className="relative flex size-8 shrink-0 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="Dashi Sushi" className="size-full object-cover" />
        </span>
        <span className="truncate font-heading text-base font-semibold tracking-tight">{nomeRestaurante}</span>
      </Link>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {souDona && slug && <PainelSwitcher slug={slug} compact />}
        <span className="num hidden text-xs text-muted-foreground sm:inline">{clock}</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
