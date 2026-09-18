"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function CustomerHeader({ nomeRestaurante = "Dashi Sushi" }: { nomeRestaurante?: string }) {
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
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base leading-none">🍣</span>
        <span className="truncate font-heading text-base font-semibold tracking-tight">{nomeRestaurante}</span>
      </Link>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        <span className="num hidden text-xs text-muted-foreground sm:inline">{clock}</span>
        <Link href="/entrar" className="text-xs whitespace-nowrap text-muted-foreground underline-offset-4 hover:underline">
          Sou da equipe
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
