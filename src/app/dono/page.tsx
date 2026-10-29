export const dynamic = "force-dynamic";

import Link from "next/link";
import { GraficoPorHora, KpiAndamento, KpiCard, MaisVendidos, PedidosAoVivo } from "@/components/DashboardDono";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getItensAgrupadosPorPedido, getPedidosDesde } from "@/db/queries/pedidos";
import { getRestaurantePorId } from "@/db/queries/restaurantes";
import { faturamentoPorHora, maisVendidos, resumoAndamento, serieDiaria, variacaoPct } from "@/lib/dashboard";
import { fmtBRL, getHojeISO, inicioDoDia, origemLabel } from "@/lib/data";
import { contaComoFaturamento, pedidoConcluido } from "@/lib/faturamento";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";

const DIAS_SERIE = 7;

export default async function DonoDashboardPage() {
  const dono = await requireFuncionarioAccess("dono");
  const agora = new Date();
  const desde = inicioDoDia(new Date(agora.getTime() - (DIAS_SERIE - 1) * 86_400_000));

  const [pedidosPeriodo, restaurante] = await Promise.all([
    getPedidosDesde(dono.restauranteId, desde),
    getRestaurantePorId(dono.restauranteId),
  ]);

  const hojeISO = getHojeISO(agora);
  const pedidosHoje = pedidosPeriodo.filter((p) => getHojeISO(p.criadoEm) === hojeISO);
  const itensPorPedido = await getItensAgrupadosPorPedido(pedidosHoje.map((p) => p.id));

  const serie = serieDiaria(pedidosPeriodo, DIAS_SERIE, agora);
  const hoje = serie[serie.length - 1];
  const ontem = serie[serie.length - 2];
  const emAndamento = pedidosHoje.filter((p) => !pedidoConcluido(p));

  const aoVivo = [...pedidosHoje]
    .reverse()
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      quem: origemLabel(p),
      itens: (itensPorPedido.get(p.id) ?? []).map((i) => `${i.quantidade}x ${i.nome}`).join(", ") || "—",
      status: p.status,
      total: p.total,
      criadoEm: p.criadoEm.getTime(),
    }));

  const dataExtenso = agora.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">Olá, {dono.nome}</h2>
          <p className="text-sm text-muted-foreground">
            Resumo de hoje na {restaurante?.nome ?? "sua loja"} · {dataExtenso}
          </p>
        </div>
        <Link href="/dono/financeiro" className={buttonVariants({ size: "lg" })}>
          Fechar caixa
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Faturado hoje"
          valor={fmtBRL(hoje.faturado)}
          serie={serie.map((d) => d.faturado)}
          pct={variacaoPct(hoje.faturado, ontem.faturado)}
        />
        <KpiCard
          titulo="Pedidos"
          valor={String(pedidosHoje.length)}
          serie={serie.map((d) => d.pedidos)}
          absoluto={pedidosHoje.length - ontem.pedidos}
        />
        <KpiCard
          titulo="Ticket médio"
          valor={fmtBRL(hoje.ticket)}
          serie={serie.map((d) => d.ticket)}
          pct={variacaoPct(hoje.ticket, ontem.ticket)}
        />
        <KpiAndamento valor={emAndamento.length} detalhe={resumoAndamento(pedidosHoje)} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.55fr_1fr]">
        <Card className="gap-2 px-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold">Faturamento por hora</h3>
            <span className="text-xs text-muted-foreground">hoje</span>
          </div>
          <GraficoPorHora horas={faturamentoPorHora(pedidosHoje.filter(contaComoFaturamento))} />
        </Card>
        <Card className="gap-3 px-4 py-4">
          <h3 className="font-heading text-sm font-bold">Mais vendidos hoje</h3>
          <MaisVendidos itens={maisVendidos(pedidosHoje, itensPorPedido)} />
        </Card>
      </div>

      <PedidosAoVivo pedidos={aoVivo} />
    </div>
  );
}
