"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { fechamentosCaixa } from "../db/schema";
import { assertFuncionario } from "../lib/funcionarioAuth";
import { getPedidosDoDia } from "../db/queries/pedidos";
import { registrarAtividade } from "../db/queries/atividades";
import { contaComoFaturamento } from "../lib/faturamento";
import { fmtBRL, getHojeISO } from "../lib/data";

export async function fecharCaixaDoDia() {
  const dono = await assertFuncionario("dono");
  const dataISO = getHojeISO();

  const pedidosHoje = await getPedidosDoDia(dono.restauranteId);
  const concluidos = pedidosHoje.filter((p) => contaComoFaturamento(p) && p.formaPagamento);

  const porForma = { dinheiro: 0, cartao: 0, pix: 0 };
  for (const p of concluidos) {
    if (p.formaPagamento) porForma[p.formaPagamento] += p.total;
  }
  const total = porForma.dinheiro + porForma.cartao + porForma.pix;

  await getDb()
    .insert(fechamentosCaixa)
    .values({
      restauranteId: dono.restauranteId,
      data: dataISO,
      dinheiro: porForma.dinheiro,
      cartao: porForma.cartao,
      pix: porForma.pix,
      total,
      fechadoPorFuncionarioId: dono.id,
    })
    .onConflictDoUpdate({
      target: [fechamentosCaixa.data, fechamentosCaixa.restauranteId],
      set: { dinheiro: porForma.dinheiro, cartao: porForma.cartao, pix: porForma.pix, total, fechadoEm: new Date() },
    });

  await registrarAtividade({
    restauranteId: dono.restauranteId,
    funcionarioId: dono.id,
    nomeFuncionario: dono.nome,
    acao: "Fechou caixa do dia",
    detalhe: `${dataISO} — total ${fmtBRL(total)}`,
  });
  revalidatePath("/dono/financeiro");
}
