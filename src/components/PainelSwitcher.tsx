"use client";

import { Bike, ChevronDown, ConciergeBell, LayoutDashboard, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

/** Menu só pra dona trocar de painel com um toque — ela já tem acesso a
 * todas essas telas com a mesma conta (atende, cozinha e administra
 * sozinha), só faltava um jeito rápido de ir de uma pra outra sem digitar
 * URL ou perder a sessão. `compact` mostra só o ícone, pra caber nas
 * topbars mais estreitas (atendente/cozinha). Usa `variant="ghost"` (em vez
 * de `outline`, que pinta um fundo claro fixo) pra herdar a cor de texto do
 * cabeçalho onde é colocado — sem isso o ícone ficava lavado em cima das
 * barras escuras (StaffTopbar/DonoSidebar).
 *
 * O menu some do DOM quando fechado (Base UI), então o prefetch automático
 * do `Link` nunca tem chance de rodar antes do toque — por isso disparamos
 * `router.prefetch` manualmente assim que o componente monta, pra essas 4
 * telas já estarem prontas quando ela abrir o menu. */
export default function PainelSwitcher({
  slug,
  compact = false,
  className,
}: {
  slug: string;
  compact?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const visoes = [
    { href: "/dono", label: "Painel da dona", descricao: "Visão geral do negócio", icon: LayoutDashboard },
    { href: "/cozinha", label: "Atendimento", descricao: "Mesas e cozinha", icon: ConciergeBell },
    { href: "/motoboy", label: "Motoboy", descricao: "Entregas", icon: Bike },
    { href: `/loja/${slug}`, label: "Cardápio", descricao: "Como o cliente vê", icon: UtensilsCrossed },
  ];

  useEffect(() => {
    for (const v of visoes) router.prefetch(v.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size={compact ? "icon-sm" : "sm"}
            aria-label="Trocar de painel"
            className={className}
          />
        }
      >
        <LayoutDashboard />
        {!compact && (
          <>
            Trocar de painel
            <ChevronDown />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 min-w-72 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-[11px] tracking-wide uppercase">
            Trocar de painel
          </DropdownMenuLabel>
          {visoes.map((v) => {
            const ativo = pathname === v.href || pathname.startsWith(`${v.href}/`);
            return (
              <DropdownMenuItem
                key={v.href}
                render={<Link href={v.href} />}
                className={cn("gap-3 rounded-md px-2 py-2", ativo && "bg-accent text-accent-foreground")}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
                    ativo && "bg-primary text-primary-foreground",
                  )}
                >
                  <v.icon className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{v.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{v.descricao}</span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
