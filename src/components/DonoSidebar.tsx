"use client";

import { UserButton } from "@clerk/nextjs";
import { Boxes, ClipboardList, LayoutDashboard, LineChart, QrCode, Users, UsersRound, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DonoTabBar from "@/components/DonoTabBar";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const TABS = [
  { href: "/dono", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dono/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/dono/financeiro", label: "Financeiro", icon: LineChart },
  { href: "/dono/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/dono/mesas", label: "Mesas", icon: QrCode },
  { href: "/dono/estoque", label: "Estoque", icon: Boxes },
  { href: "/dono/clientes", label: "Clientes", icon: UsersRound },
  { href: "/dono/funcionarios", label: "Funcionários", icon: Users },
];

const TITLES: Record<string, string> = {
  "/dono": "Painel da dona",
  "/dono/pedidos": "Histórico de pedidos",
  "/dono/financeiro": "Financeiro",
  "/dono/cardapio": "Cardápio",
  "/dono/mesas": "Mesas",
  "/dono/estoque": "Estoque",
  "/dono/clientes": "Clientes",
  "/dono/funcionarios": "Funcionários",
};

export default function DonoSidebar({
  nome,
  nomeRestaurante,
  children,
}: {
  nome: string;
  nomeRestaurante: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/15 text-base leading-none">🍣</span>
            <div className="flex flex-col">
              <span className="font-heading text-base font-semibold leading-tight tracking-tight">{nomeRestaurante}</span>
              <span className="text-xs text-sidebar-foreground/60">Painel da dona</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {TABS.map((t) => (
                  <SidebarMenuItem key={t.href}>
                    <SidebarMenuButton isActive={pathname === t.href} render={<Link href={t.href} />}>
                      <t.icon />
                      <span>{t.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <UserButton />
            <span className="flex-1 truncate text-sm text-sidebar-foreground/80">{nome}</span>
            <ThemeToggle className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
          <SidebarTrigger className="hidden md:inline-flex" />
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base leading-none md:hidden">🍣</span>
          <span className="min-w-0 truncate font-heading text-lg font-semibold">{TITLES[pathname] ?? "Dashi Sushi"}</span>
          <div className="ml-auto flex shrink-0 items-center gap-2 md:hidden">
            <ThemeToggle />
            <UserButton />
          </div>
        </header>
        <div className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</div>
      </SidebarInset>

      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <DonoTabBar />
      </div>
    </SidebarProvider>
  );
}
