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
      {/* Essa tela é compartilhada por todos os restaurantes do sistema (ainda
       * não sabemos de qual tenant é esse login) — por isso usa o ícone
       * genérico do sistema, não a marca de um restaurante específico. */}
      <span className="relative flex size-9 shrink-0 overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="" className="size-full object-cover" />
      </span>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-heading text-lg font-semibold">{titulo}</h1>
        <p className="max-w-xs text-sm text-muted-foreground">{descricao}</p>
      </div>
      {children}
    </div>
  );
}
