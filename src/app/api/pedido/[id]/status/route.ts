import { NextResponse } from "next/server";
import { getPedidoComItens } from "@/db/queries/pedidos";
import { expirarSePassouDoPrazo } from "@/lib/pagamentoOnline";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let resultado = await getPedidoComItens(id);
  if (!resultado) return NextResponse.json(null, { status: 404 });
  if (resultado.pedido.status === "aguardando_pagamento") {
    await expirarSePassouDoPrazo(resultado.pedido).catch((e) => console.error("[asaas] falha ao expirar:", e));
    resultado = (await getPedidoComItens(id)) ?? resultado;
  }
  const { pedido } = resultado;
  const retirada = !pedido.endereco || /retirada/i.test(pedido.endereco);
  return NextResponse.json({ status: pedido.status, retirada });
}
