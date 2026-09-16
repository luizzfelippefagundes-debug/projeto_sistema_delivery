"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

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
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 shadow-sm md:px-6">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-lg leading-none">🍣</span>
        <div className="flex flex-col leading-tight">
          <span className="font-heading text-base font-semibold tracking-tight">{nomeRestaurante}</span>
          <span className="text-xs text-muted-foreground">Cardápio online</span>
        </div>
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <span className="num hidden text-xs text-muted-foreground sm:inline">{clock}</span>
        <Link href="/entrar" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          Sou da equipe
        </Link>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button size="sm">Entrar</Button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <Link href="/meus-pedidos" className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline">
            <ClipboardList className="size-3.5" /> Meus pedidos
          </Link>
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
