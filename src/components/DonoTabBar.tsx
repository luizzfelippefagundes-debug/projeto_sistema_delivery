"use client";

import {
  Boxes,
  ClipboardList,
  Grid2x2,
  LayoutDashboard,
  LineChart,
  QrCode,
  Users,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TABS = [
  { href: "/dono", label: "Início", icon: LayoutDashboard },
  { href: "/dono/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/dono/financeiro", label: "Financeiro", icon: LineChart },
  { href: "/dono/cardapio", label: "Cardápio", icon: UtensilsCrossed },
];

const MAIS_LINKS = [
  { href: "/dono/mesas", label: "Mesas", icon: QrCode },
  { href: "/dono/estoque", label: "Estoque", icon: Boxes },
  { href: "/dono/clientes", label: "Clientes", icon: UsersRound },
  { href: "/dono/funcionarios", label: "Funcionários", icon: Users },
];

export default function DonoTabBar() {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);
  const emMais = MAIS_LINKS.some((l) => l.href === pathname);

  return (
    <>
      <nav className="border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom,0px)]">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {TABS.map((t) => {
            const ativo = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  ativo ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                }`}
              >
                <t.icon className="size-5" />
                {t.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMaisAberto(true)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              emMais ? "text-sidebar-primary" : "text-sidebar-foreground/50"
            }`}
          >
            <Grid2x2 className="size-5" />
            Mais
          </button>
        </div>
      </nav>

      <Dialog open={maisAberto} onOpenChange={setMaisAberto}>
        <DialogContent className="w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-sm">
          <DialogHeader className="p-4">
            <DialogTitle>Mais opções</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 p-4 pt-0">
            {MAIS_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMaisAberto(false)}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-sm font-medium transition-colors hover:border-primary/40"
              >
                <l.icon className="size-5 text-primary" />
                {l.label}
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
