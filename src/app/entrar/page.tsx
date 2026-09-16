import { ChefHat, ClipboardList, Crown, Truck } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const OPCOES = [
  { href: "/entrar/dono", label: "Sou a dona", icon: Crown, tint: "bg-status-danger-bg text-status-danger-fg" },
  { href: "/entrar/atendente", label: "Sou atendente", icon: ClipboardList, tint: "bg-status-neutral-bg text-status-neutral-fg" },
  { href: "/entrar/cozinha", label: "Sou da cozinha", icon: ChefHat, tint: "bg-status-warn-bg text-status-warn-fg" },
  { href: "/entrar/motoboy", label: "Sou motoboy", icon: Truck, tint: "bg-status-ok-bg text-status-ok-fg" },
];

export default function EntrarPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-lg leading-none">🍣</span>
        <span className="font-heading text-base font-semibold tracking-tight">Dashi Sushi</span>
      </div>
      <div className="text-center">
        <h1 className="font-heading text-lg font-semibold">Como você acessa?</h1>
        <p className="text-sm text-muted-foreground">Escolha uma opção pra continuar.</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        {OPCOES.map(({ href, label, icon: Icon, tint }) => (
          <Link key={href} href={href}>
            <Card className="flex-row items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:border-primary/40">
              <CardContent className="flex items-center gap-3 p-0">
                <span className={`flex size-9 items-center justify-center rounded-full ${tint}`}>
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        Sou cliente, quero ver o cardápio
      </Link>
    </div>
  );
}
