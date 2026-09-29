import { UserButton } from "@clerk/nextjs";
import NotificacoesPushButton from "@/components/NotificacoesPushButton";
import PainelSwitcher from "@/components/PainelSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

export default function StaffTopbar({
  titulo,
  nome,
  nomeRestaurante,
  painelSwitcherSlug,
}: {
  titulo: string;
  nome: string;
  nomeRestaurante: string;
  /** A dona entrou aqui pra atender/cozinhar, sem trocar de conta — passa o
   * slug da loja pra mostrar o menu de trocar de painel. Indefinido pra
   * quem não é dona (só vê a própria área). */
  painelSwitcherSlug?: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground">
      {painelSwitcherSlug && <PainelSwitcher slug={painelSwitcherSlug} compact />}
      <span className="relative flex size-8 shrink-0 overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="Dashi Sushi" className="size-full object-cover" />
      </span>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-heading text-sm font-semibold">{titulo}</span>
        <span className="truncate text-xs text-sidebar-foreground/60">{nomeRestaurante}</span>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <NotificacoesPushButton />
        <ThemeToggle className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
        <span className="hidden max-w-24 truncate text-sm text-sidebar-foreground/80 sm:inline">{nome}</span>
        <UserButton />
      </div>
    </header>
  );
}
