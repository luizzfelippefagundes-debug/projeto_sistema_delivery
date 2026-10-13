import { NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { pedidos } from "@/db/schema";
import { expirarPagamentosVencidos } from "@/lib/pagamentoOnline";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Conta desde a criação do pedido, e tem pedido que leva mais de 3h só pra ficar pronto.
  const seisHorasAtras = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const atualizados = await getDb()
    .update(pedidos)
    .set({ status: "entregue" })
    .where(
      and(
        eq(pedidos.status, "rota"),
        lt(pedidos.criadoEm, seisHorasAtras),
      ),
    )
    .returning({ id: pedidos.id });

  // Pedidos que ficaram esperando Pix sem ninguém voltar na página.
  const expirados = await expirarPagamentosVencidos();

  revalidatePath("/motoboy");
  revalidatePath("/dono");
  revalidatePath("/dono/pedidos");

  return NextResponse.json({ expirados, confirmados: atualizados.length, ids: atualizados.map((p) => p.id) });
}
