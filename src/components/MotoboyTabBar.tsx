"use client";

import { History, Package, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/motoboy", label: "Entregas", icon: Package },
  { href: "/motoboy/historico", label: "Histórico", icon: History },
  { href: "/motoboy/perfil", label: "Perfil", icon: User },
];

export default function MotoboyTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom,0px)]">
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
      </div>
    </nav>
  );
}
