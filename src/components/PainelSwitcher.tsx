"use client";

import { Bike, ChevronDown, ConciergeBell, LayoutDashboard, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Menu só pra dona trocar de painel com um toque — ela já tem acesso a
 * todas essas telas com a mesma conta (atende, cozinha e administra
 * sozinha), só faltava um jeito rápido de ir de uma pra outra sem digitar
 * URL ou perder a sessão. `compact` mostra só o ícone, pra caber nas
 * topbars mais estreitas (atendente/cozinha). */
export default function PainelSwitcher({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const visoes = [
    { href: "/dono", label: "Painel da dona", icon: LayoutDashboard },
    { href: "/cozinha", label: "Atendimento (mesas + cozinha)", icon: ConciergeBell },
    { href: "/motoboy", label: "Motoboy", icon: Bike },
    { href: `/loja/${slug}`, label: "Cardápio (cliente)", icon: UtensilsCrossed },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size={compact ? "icon-sm" : "sm"} aria-label="Trocar de painel" />
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
      <DropdownMenuContent align="start">
        {visoes.map((v) => (
          <DropdownMenuItem key={v.href} render={<Link href={v.href} />}>
            <v.icon /> {v.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
