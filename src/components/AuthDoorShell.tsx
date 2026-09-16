import ThemeToggle from "@/components/ThemeToggle";

export default function AuthDoorShell({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-lg leading-none">🍣</span>
        <span className="font-heading text-base font-semibold tracking-tight">Dashi Sushi</span>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-heading text-lg font-semibold">{titulo}</h1>
        <p className="max-w-xs text-sm text-muted-foreground">{descricao}</p>
      </div>
      {children}
    </div>
  );
}
