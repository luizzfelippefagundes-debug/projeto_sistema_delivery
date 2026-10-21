"use client";

import { AlertTriangle, ChefHat, MapPin, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { avancarStatusCozinha, avancarStatusEntrega } from "@/actions/pedidos.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { estaAtrasado, fmtBRL, fmtDiaHora, origemLabel } from "@/lib/data";
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

const COLS: { key: OrderStatus; label: string }[] = [
  { key: "novo", label: "Novo" },
  { key: "preparo", label: "Em preparo" },
  { key: "pronto", label: "Pronto" },
];

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
  podeDespachar = false,
}: {
  pedidos: PedidoCozinha[];
  /** Dona/motoboy podem mandar o pedido pronto pra rota direto daqui. */
  podeDespachar?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [aba, setAba] = useState<OrderStatus>("novo");

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex flex-col gap-5">
      <ListaProducao pedidos={pedidos} />
      {/* No celular as 3 colunas viram abas — uma pilha só ficava comprida demais. */}
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 sm:hidden" role="tablist">
        {COLS.map((col) => (
          <button
            key={col.key}
            type="button"
            role="tab"
            aria-selected={aba === col.key}
            onClick={() => setAba(col.key)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors ${
              aba === col.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {col.label}
            <Badge variant="outline">{pedidos.filter((o) => o.status === col.key).length}</Badge>
          </button>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {COLS.map((col) => {
          const doGrupo = pedidos.filter((o) => o.status === col.key).sort((a, b) => a.criadoEm - b.criadoEm);

          return (
            <div key={col.key} className={aba === col.key ? "" : "hidden sm:block"}>
              <div className="mb-3 hidden items-center justify-between sm:flex">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{col.label}</h3>
                <Badge variant="outline">{doGrupo.length}</Badge>
              </div>
              <div className="flex flex-col gap-3">
                {doGrupo.length === 0 && <p className="text-sm text-muted-foreground">Nada por aqui.</p>}
                {doGrupo.map((o) => {
                  const atrasado = estaAtrasado(o.criadoEm, o.status);
                  return (
                    <Card
                      key={o.id}
                      className={`gap-3 py-4 ${atrasado ? "border-status-danger-fg/50 bg-status-danger-bg/30" : ""}`}
                    >
                      <CardContent className="flex flex-col gap-3 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{origemLabel(o)}</span>
                            {atrasado && (
                              <Badge className="bg-status-danger-bg text-status-danger-fg">
                                <AlertTriangle className="size-3" /> Atrasado
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{fmtDiaHora(o.criadoEm)}</span>
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
