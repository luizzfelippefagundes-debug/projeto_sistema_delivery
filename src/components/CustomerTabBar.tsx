"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { ClipboardList, UtensilsCrossed, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CustomerTabBar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const hrefCardapio = `/loja/${slug}`;
  const ativoCardapio = pathname === hrefCardapio;
  const ativoPedidos = pathname === "/meus-pedidos" || pathname.startsWith("/pedido/");

  const itemClass = (ativo: boolean) =>
    `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
      ativo ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <nav className="border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        <Link href={hrefCardapio} className={itemClass(ativoCardapio)}>
          <UtensilsCrossed className="size-5" />
          Cardápio
        </Link>
        <Link href="/meus-pedidos" className={itemClass(ativoPedidos)}>
          <ClipboardList className="size-5" />
          Pedidos
        </Link>
        <Show when="signed-in">
          <div className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground">
            <UserButton appearance={{ elements: { avatarBox: "size-5" } }} />
            Conta
          </div>
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button type="button" className={itemClass(false)}>
              <UserRound className="size-5" />
              Entrar
            </button>
          </SignInButton>
        </Show>
      </div>
    </nav>
  );
}
