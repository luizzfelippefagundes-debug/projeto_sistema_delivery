"use client";

import { Show, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { ClipboardList, UtensilsCrossed, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { lerPedidosConvidado } from "@/lib/pedidosConvidado";

export default function CustomerTabBar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useUser();

  const hrefCardapio = `/loja/${slug}`;
  const ativoCardapio = pathname === hrefCardapio;
  const ativoPedidos = pathname === "/meus-pedidos" || pathname.startsWith("/pedido/");

  // Lê o localStorage na hora do clique (não ao montar) — o pedido pode
  // ter sido feito na mesma sessão da página, depois que a barra já tinha
  // carregado, então um valor lido só no mount ficaria desatualizado.
  function irParaPedidos() {
    const ids = isSignedIn ? [] : lerPedidosConvidado();
    router.push(ids.length > 0 ? `/meus-pedidos?guest=${ids.join(",")}` : "/meus-pedidos");
  }

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
        <button type="button" onClick={irParaPedidos} className={itemClass(ativoPedidos)}>
          <ClipboardList className="size-5" />
          Pedidos
        </button>
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
