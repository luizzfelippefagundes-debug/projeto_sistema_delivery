import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { fmtBRL, minAgo } from "@/lib/data";
import type { OrderStatus } from "@/lib/types";

function Sparkline({ valores, className }: { valores: number[]; className?: string }) {
  const max = Math.max(...valores, 0);
  const min = Math.min(...valores, 0);
  const faixa = max - min || 1;
  const n = valores.length;
  const pontos = valores
    .map((v, i) => `${n === 1 ? 60 : (i / (n - 1)) * 120},${24 - ((v - min) / faixa) * 20}`)
    .join(" ");
  return (
    <svg viewBox="0 0 120 26" preserveAspectRatio="none" aria-hidden="true" className={`h-6 w-full ${className ?? ""}`}>
      <polyline points={pontos} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Variacao({ pct, absoluto }: { pct?: number | null; absoluto?: number }) {
  let texto: string | null = null;
  let positivo = true;
  if (absoluto !== undefined) {
    if (absoluto === 0) return null;
    texto = String(Math.abs(absoluto));
    positivo = absoluto > 0;
  } else if (pct != null && Number.isFinite(pct)) {
    const arred = Math.round(pct);
    if (arred === 0) return null;
    texto = `${Math.abs(arred)}%`;
    positivo = arred > 0;
  }
  if (!texto) return null;
  return (
    <span
      className={`num inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        positivo ? "bg-status-ok-bg text-status-ok-fg" : "bg-status-warn-bg text-status-warn-fg"
      }`}
    >
      {positivo ? <ArrowUp className="size-3" aria-label="subiu" /> : <ArrowDown className="size-3" aria-label="caiu" />}
      {texto}
    </span>
  );
}

export function KpiCard({
  titulo,
  valor,
  serie,
  pct,
  absoluto,
}: {
  titulo: string;
  valor: string;
  serie: number[];
  pct?: number | null;
  absoluto?: number;
}) {
  return (
    <Card className="gap-1.5 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{titulo}</span>
        <Variacao pct={pct} absoluto={absoluto} />
      </div>
      <p className="num font-heading text-2xl font-extrabold">{valor}</p>
      <Sparkline valores={serie} className="text-primary" />
    </Card>
  );
}

export function KpiAndamento({ valor, detalhe }: { valor: number; detalhe: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-sidebar px-4 py-4 text-sidebar-foreground">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wide uppercase opacity-70">Em andamento</span>
        <span className="size-2 rounded-full bg-sidebar-primary" />
      </div>
      <p className="num font-heading text-2xl font-extrabold">{valor}</p>
      <p className="mt-auto pt-2 text-[11px] opacity-70">{detalhe}</p>
    </div>
  );
}

export function GraficoPorHora({ horas }: { horas: number[] }) {
  const comVenda = horas.map((v, h) => (v > 0 ? h : -1)).filter((h) => h >= 0);
  if (comVenda.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Sem vendas concluídas ainda hoje.</p>;
  }
  let ini = Math.max(0, comVenda[0] - 1);
  let fim = Math.min(23, comVenda[comVenda.length - 1] + 1);
  while (fim - ini < 5) {
    if (ini > 0) ini -= 1;
    if (fim - ini < 5 && fim < 23) fim += 1;
    if (ini === 0 && fim === 23) break;
  }
  const dados = horas.slice(ini, fim + 1);
  const max = Math.max(...dados) || 1;
  const W = 460;
  const H = 120;
  const x = (i: number) => (i / (dados.length - 1)) * W;
  const y = (v: number) => H - 8 - (v / max) * (H - 24);

  let linha = `M${x(0)},${y(dados[0])}`;
  for (let i = 1; i < dados.length; i++) {
    const meio = (x(i - 1) + x(i)) / 2;
    linha += ` C${meio},${y(dados[i - 1])} ${meio},${y(dados[i])} ${x(i)},${y(dados[i])}`;
  }
  const area = `${linha} L${W},${H} L0,${H} Z`;
  const horaTxt = (h: number) => `${String(h).padStart(2, "0")}h`;

  return (
    <div className="text-primary">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Faturamento por hora" className="h-32 w-full">
        <defs>
          <linearGradient id="grad-faturamento-hora" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.32" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#grad-faturamento-hora)" />
        <path d={linha} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="num mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{horaTxt(ini)}</span>
        <span>pico {horaTxt(ini + dados.indexOf(max))} · {fmtBRL(max)}</span>
        <span>{horaTxt(fim)}</span>
      </div>
    </div>
  );
}

export function MaisVendidos({ itens }: { itens: { nome: string; quantidade: number }[] }) {
  if (itens.length === 0) return <p className="text-sm text-muted-foreground">Nenhum item vendido ainda hoje.</p>;
  const max = itens[0].quantidade;
  return (
    <div className="flex flex-col gap-3">
      {itens.map((i, idx) => (
        <div key={i.nome}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">{i.nome}</span>
            <span className="num font-bold">{i.quantidade}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(i.quantidade / max) * 100}%`, opacity: 1 - idx * 0.2 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface PedidoAoVivo {
  id: string;
  quem: string;
  itens: string;
  status: OrderStatus;
  total: number;
  criadoEm: number;
}

export function PedidosAoVivo({ pedidos }: { pedidos: PedidoAoVivo[] }) {
  return (
    <Card className="gap-1 px-4 py-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold">Pedidos ao vivo</h3>
        <Link href="/dono/pedidos" className="text-xs font-bold text-primary hover:underline">
          Ver todos
        </Link>
      </div>
      {pedidos.length === 0 && <p className="py-4 text-sm text-muted-foreground">Nenhum pedido ainda hoje.</p>}
      {pedidos.map((p) => (
        <div
          key={p.id}
          className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-t border-border py-2.5 text-sm sm:grid-cols-[1.1fr_1.7fr_auto_auto_3rem]"
        >
          <span className="truncate font-semibold">{p.quem}</span>
          <span className="order-last col-span-2 truncate text-xs text-muted-foreground sm:order-none sm:col-span-1 sm:text-sm">
            {p.itens}
          </span>
          <StatusBadge status={p.status} />
          <span className="num hidden font-bold sm:block">{fmtBRL(p.total)}</span>
          <span className="num hidden text-right text-xs text-muted-foreground sm:block">{minAgo(p.criadoEm)}</span>
        </div>
      ))}
    </Card>
  );
}
