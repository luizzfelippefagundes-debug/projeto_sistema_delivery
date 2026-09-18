import EstoqueManager from "@/components/EstoqueManager";
import { getItensComEstoque } from "@/db/queries/cardapio";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

export default async function EstoquePage() {
  const dono = await requireFuncionarioAccess("dono");
  const itens = await getItensComEstoque(dono.restauranteId);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Só aparecem aqui os itens com controle de estoque ligado. Cada venda desconta sozinho, e o item pausa
        automaticamente quando o estoque zera.
      </p>
      <EstoqueManager itens={itens} />
    </div>
  );
}
