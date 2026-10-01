import { notFound } from "next/navigation";
import AutoPrint from "@/components/AutoPrint";
import { getPedidoComItens } from "@/db/queries/pedidos";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { fmtBRL, origemLabel } from "@/lib/data";
import { requireQualquerFuncionario } from "@/lib/funcionarioAuth";
import type { Pagamento } from "@/lib/types";

const PAGAMENTO_LABEL: Record<Pagamento, string> = {
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pix: "Pix",
};

export default async function ImprimirComandaPage({ params }: { params: Promise<{ pedidoId: string }> }) {
  const funcionario = await requireQualquerFuncionario();
  const { pedidoId } = await params;

  const resultado = await getPedidoComItens(pedidoId);
  if (!resultado || resultado.pedido.restauranteId !== funcionario.restauranteId) notFound();
  const { pedido, itens } = resultado;

  const restaurante = await getRestaurantePorId(funcionario.restauranteId);

  return (
    <div className="mx-auto flex max-w-xs flex-col gap-3 bg-white p-4 font-mono text-black print:max-w-none print:p-0">
      <AutoPrint />

      <div className="text-center">
        <p className="text-4xl font-bold uppercase">{restaurante?.nome ?? "Restaurante"}</p>
        <p className="text-2xl">{origemLabel(pedido)}</p>
        <p className="text-2xl">
          {pedido.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </p>
      </div>

      <div className="border-t border-dashed border-black" />

      {(pedido.telefoneCliente || pedido.endereco) && (
        <>
          <div className="flex flex-col gap-0.5 text-2xl">
            {pedido.telefoneCliente && <p>Tel: {pedido.telefoneCliente}</p>}
            {pedido.endereco && <p>End: {pedido.endereco}</p>}
          </div>
          <div className="border-t border-dashed border-black" />
        </>
      )}

      <div className="flex flex-col gap-1 text-3xl">
        {itens.map((item) => (
          <div key={item.id} className="flex flex-col gap-0.5">
            <span>
              {item.quantidade}x {item.nome}
            </span>
            <span className="font-bold">{fmtBRL(item.preco * item.quantidade)}</span>
            {item.observacao && <span className="text-2xl">↳ {item.observacao}</span>}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black" />

      {pedido.taxaEntrega != null && pedido.taxaEntrega > 0 && (
        <div className="flex justify-between text-3xl">
          <span>Taxa de entrega</span>
          <span>{fmtBRL(pedido.taxaEntrega)}</span>
        </div>
      )}

      <div className="flex justify-between text-4xl font-bold">
        <span>TOTAL</span>
        <span>{fmtBRL(pedido.total)}</span>
      </div>

      {pedido.formaPagamento && (
        <p className="text-center text-2xl">Pagamento: {PAGAMENTO_LABEL[pedido.formaPagamento]}</p>
      )}
      {pedido.cpfNota && <p className="text-center text-2xl">CPF na nota: {pedido.cpfNota}</p>}

      <div className="border-t border-dashed border-black" />
      <p className="text-center text-2xl">Obrigado pela preferência! 🍣</p>
    </div>
  );
}
