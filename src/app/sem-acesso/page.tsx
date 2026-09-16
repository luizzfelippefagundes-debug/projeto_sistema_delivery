import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SemAcessoPage() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Sua conta ainda não tem acesso a essa área. Fale com a Dashi Sushi pra liberar seu acesso.
        </p>
        <Button render={<Link href="/" />}>Voltar pro cardápio</Button>
      </CardContent>
    </Card>
  );
}
