import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/ThemeToggle";

export default function StaffTopbar({
  titulo,
  nome,
  nomeRestaurante,
}: {
  titulo: string;
  nome: string;
  nomeRestaurante: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/15 text-base leading-none">🍣</span>
      <div className="flex flex-col leading-tight">
        <span className="font-heading text-sm font-semibold">{titulo}</span>
        <span className="text-xs text-sidebar-foreground/60">{nomeRestaurante}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
        <span className="text-sm text-sidebar-foreground/80">{nome}</span>
        <UserButton />
      </div>
    </header>
  );
}
