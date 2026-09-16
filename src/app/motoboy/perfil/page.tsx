import { SignOutButton } from "@clerk/nextjs";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export const dynamic = "force-dynamic";

export default async function MotoboyPerfilPage() {
  const funcionario = await requireFuncionarioAccess("motoboy");
  const restaurante = await getRestaurantePorId(funcionario.restauranteId);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Card>
        <CardContent className="flex items-center gap-4 px-4 py-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-7" />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold">{funcionario.nome}</p>
            <p className="text-sm text-muted-foreground">Motoboy · {restaurante?.nome ?? "Restaurante"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-1 px-4 py-2">
          <div className="flex items-center justify-between py-3 text-sm">
            <span className="text-muted-foreground">Telefone</span>
            <span className="font-medium">{funcionario.telefone ?? "Não informado"}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border py-3 text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">{funcionario.ativo ? "Ativo" : "Inativo"}</span>
          </div>
        </CardContent>
      </Card>

      <SignOutButton>
        <Button variant="outline" className="w-full">
          <LogOut /> Sair da conta
        </Button>
      </SignOutButton>
    </div>
  );
}
