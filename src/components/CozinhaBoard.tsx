"use client";

import { AlertTriangle, CheckCircle2, ChefHat, Clock, MapPin, Printer, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { avancarStatusCozinha, avancarStatusEntrega, confirmarEntregaForca } from "@/actions/pedidos.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { estaAtrasado, fmtBRL, origemLabel } from "@/lib/data";
import { montarListaProducao } from "@/lib/listaProducao";
import type { OrderStatus } from "@/lib/types";

export interface PedidoCozinha {
  id: string;
  origem: "salao" | "delivery";
  mesa: number | null;
  clienteNome: string | null;
  endereco: string | null;
  status: OrderStatus;
  total: number;
  criadoEm: number;
  itens: { nome: string; quantidade: number; observacao: string | null }[];
}

export interface PedidoEmRota {
  id: string;
  clienteNome: string | null;
  endereco: string | null;
  total: number;
  criadoEm: number;
}

type ColunaKey = "novo" | "preparo" | "pronto" | "rota";
type Filtro = "todos" | "salao" | "delivery";

const COLS: { key: ColunaKey; label: string; ponto: string }[] = [
  { key: "novo", label: "Novo", ponto: "bg-violet-400" },
  { key: "preparo", label: "Em preparo", ponto: "bg-amber-400" },
  { key: "pronto", label: "Pronto", ponto: "bg-emerald-400" },
  { key: "rota", label: "Em rota", ponto: "bg-sky-400" },
];

const MIN_ATENCAO = 30;

function useAgora() {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

function fmtDuracao(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function Cronometro({ desde, agora, atrasado }: { desde: number; agora: number; atrasado: boolean }) {
  const min = Math.max(0, Math.floor((agora - desde) / 60_000));
  const cor = atrasado
    ? "bg-status-danger-bg text-status-danger-fg"
    : min >= MIN_ATENCAO
      ? "bg-status-warn-bg text-status-warn-fg"
      : "bg-status-neutral-bg text-status-neutral-fg";
  return (
    <span className={`num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cor}`}>
      {atrasado ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {fmtDuracao(min)}
    </span>
  );
}

function ListaProducao({ pedidos }: { pedidos: PedidoCozinha[] }) {
  const lista = montarListaProducao(pedidos);
  if (lista.length === 0) return null;
  const qtdPedidos = pedidos.filter((p) => p.status === "novo" || p.status === "preparo").length;

  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex items-center gap-2">
          <ChefHat className="size-5 text-primary" />
          <h3 className="font-heading text-base font-semibold">O que preparar agora</h3>
          <span className="text-xs text-muted-foreground">
            somando {qtdPedidos} pedido{qtdPedidos > 1 ? "s" : ""}
          </span>
        </div>
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((item) => (
            <li key={item.nome} className="flex gap-2.5">
              <span className="num w-9 shrink-0 text-right text-lg font-bold leading-6 text-primary">{item.quantidade}×</span>
              <div className="min-w-0">
                <p className="font-medium leading-6">{item.nome}</p>
                {item.observacoes.map((o) => (
                  <p key={o.texto} className="text-xs text-muted-foreground">
                    ↳ {o.quantidade}× {o.texto}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function CozinhaBoard({
  pedidos,
  emRota = [],
  podeDespachar = false,
  podeConfirmarEntrega = false,
}: {
  pedidos: PedidoCozinha[];
  emRota?: PedidoEmRota[];
  podeDespachar?: boolean;
  podeConfirmarEntrega?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [aba, setAba] = useState<ColunaKey>("novo");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const agora = useAgora();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  const visiveis = pedidos.filter((p) => filtro === "todos" || p.origem === filtro);
  const rotaVisivel = filtro === "salao" ? [] : emRota;
  const atrasados = pedidos.filter((p) => estaAtrasado(p.criadoEm, p.status)).length;

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "salao", label: "Mesa" },
    { key: "delivery", label: "Delivery" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <ListaProducao pedidos={pedidos} />

      {/* Filtro */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltro(f.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filtro === f.key ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        {atrasados > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-status-danger-bg px-3 py-2 text-sm font-semibold text-status-danger-fg">
            <AlertTriangle className="size-4" /> {atrasados} atrasado{atrasados > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* No celular as 4 colunas viram abas. */}
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1 sm:hidden" role="tablist">
        {COLS.map((col) => {
          const qtd = col.key === "rota"
            ? rotaVisivel.length
            : visiveis.filter((o) => o.status === col.key).length;
          return (
            <button
              key={col.key}
              type="button"
              role="tab"
              aria-selected={aba === col.key}
              onClick={() => setAba(col.key)}
              className={`flex items-center justify-center gap-1 rounded-md px-1 py-2 text-xs font-medium transition-colors ${
                aba === col.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {col.label}
              <Badge variant="outline">{qtd}</Badge>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {COLS.map((col) => {
          const doGrupo =
            col.key === "rota" ? [] : visiveis.filter((o) => o.status === col.key).sort((a, b) => a.criadoEm - b.criadoEm);
          const total = col.key === "rota" ? rotaVisivel.length : doGrupo.length;

          return (
            <div key={col.key} className={aba === col.key ? "" : "hidden sm:block"}>
              <div className="mb-3 hidden items-center justify-between sm:flex">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <span className={`size-2 rounded-full ${col.ponto}`} />
                  {col.label}
                </h3>
                <Badge variant="outline">{total}</Badge>
              </div>
              <div className="flex flex-col gap-3">
                {total === 0 && <p className="text-sm text-muted-foreground">Nada por aqui.</p>}

                {col.key === "rota" &&
                  rotaVisivel.map((p) => (
                    <Card key={p.id} className="gap-3 py-4">
                      <CardContent className="flex flex-col gap-3 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-sm font-bold">
                            <Truck className="size-4 text-sky-500" />
                            {p.clienteNome ?? "Cliente"}
                          </span>
                          <Cronometro desde={p.criadoEm} agora={agora} atrasado={false} />
                        </div>
                        {p.endereco && (
                          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 size-4 shrink-0" />
                            <span>{p.endereco}</span>
                          </p>
                        )}
                        <span className="num text-sm font-bold">{fmtBRL(p.total)}</span>
                        {podeConfirmarEntrega && (
                          <Button
                            size="lg"
                            className="w-full font-semibold"
                            disabled={pending}
                            onClick={() => startTransition(() => confirmarEntregaForca(p.id))}
                          >
                            <CheckCircle2 className="size-4" />
                            {pending ? "Confirmando…" : "Confirmar entrega"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                {doGrupo.map((o) => {
                  const atrasado = estaAtrasado(o.criadoEm, o.status);
                  return (
                    <Card
                      key={o.id}
                      className={`gap-3 py-4 ${atrasado ? "border-status-danger-fg/50 bg-status-danger-bg/30" : ""}`}
                    >
                      <CardContent className="flex flex-col gap-3 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{origemLabel(o)}</p>
                            <p className="text-xs text-muted-foreground">{o.origem === "salao" ? "Salão" : "Delivery"}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Cronometro desde={o.criadoEm} agora={agora} atrasado={atrasado} />
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label="Imprimir comanda"
                              onClick={() =>
                                window.open(
                                  `/imprimir/${o.id}?voltar=${encodeURIComponent(window.location.pathname)}`,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                            >
                              <Printer />
                            </Button>
                          </div>
                        </div>
                        {o.origem === "delivery" && o.endereco && (
                          <p className="flex items-start gap-1.5 text-sm">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <span>{o.endereco}</span>
                          </p>
                        )}
                        <ul className="list-disc pl-4 text-xs text-muted-foreground">
                          {o.itens.map((i) => (
                            <li key={i.nome}>
                              {i.quantidade}x {i.nome}
                              {i.observacao && <span className="block text-foreground">↳ {i.observacao}</span>}
                            </li>
                          ))}
                        </ul>
                        <span className="num text-sm font-bold">{fmtBRL(o.total)}</span>
                        {o.status === "novo" || o.status === "preparo" ? (
                          <div className="flex flex-col gap-2">
                            <Button
                              size="lg"
                              className="w-full text-base font-semibold"
                              disabled={pending}
                              onClick={() => startTransition(() => avancarStatusCozinha(o.id, "pronto"))}
                            >
                              Marcar pronto ✓
                            </Button>
                            {o.status === "novo" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={pending}
                                onClick={() => startTransition(() => avancarStatusCozinha(o.id, "preparo"))}
                              >
                                Iniciar preparo
                              </Button>
                            )}
                          </div>
                        ) : podeDespachar && o.origem === "delivery" ? (
                          <Button
                            size="lg"
                            className="w-full text-base font-semibold"
                            disabled={pending}
                            onClick={() =>
                              startTransition(() => avancarStatusEntrega(o.id, ehRetirada(o.endereco) ? "entregue" : "rota"))
                            }
                          >
                            {ehRetirada(o.endereco) ? "Cliente retirou ✓" : "Saiu pra entrega 🛵"}
                          </Button>
                        ) : (
                          <p className="text-center text-xs text-muted-foreground">
                            {o.origem === "salao" ? "Pronto pra servir" : "Aguardando o motoboy"}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ehRetirada(endereco: string | null) {
  return !endereco || /retirada/i.test(endereco);
}
