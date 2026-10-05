import { NextResponse } from "next/server";
import { getPedidoComItens } from "@/db/queries/pedidos";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultado = await getPedidoComItens(id);
  if (!resultado) return NextResponse.json(null, { status: 404 });
  const { pedido } = resultado;
  const retirada = !pedido.endereco || /retirada/i.test(pedido.endereco);
  return NextResponse.json({ status: pedido.status, retirada });
}
