import { NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { pedidos } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doisHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const atualizados = await getDb()
    .update(pedidos)
    .set({ status: "entregue" })
    .where(
      and(
        eq(pedidos.status, "rota"),
        lt(pedidos.criadoEm, doisHorasAtras),
      ),
    )
    .returning({ id: pedidos.id });

  revalidatePath("/motoboy");
  revalidatePath("/dono");
  revalidatePath("/dono/pedidos");

  return NextResponse.json({ confirmados: atualizados.length, ids: atualizados.map((p) => p.id) });
}
