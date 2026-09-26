"use client";

import { Minus, Plus, Printer, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enviarComandaParaCozinha, fecharMesaAction } from "@/actions/pedidos.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import { fmtBRL } from "@/lib/data";
import type { ItemCardapio, OrderStatus, Pagamento } from "@/lib/types";

export interface PedidoAbertoResumo {
  id: string;
  status: OrderStatus;
  itemCount: number;
}

interface DraftItem {
  itemCardapioId: string;
  nome: string;
  preco: number;
  qtd: number;
}

export default function MesaModal({
  mesa,
  itensCardapio,
  pedidosAbertos,
  querFechar = false,
  onClose,
}: {
  mesa: number;
  itensCardapio: ItemCardapio[];
  pedidosAbertos: PedidoAbertoResumo[];
  /** Cliente já pediu, pelo QR code, pra fechar a conta dessa mesa. */
  querFechar?: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [pagamento, setPagamento] = useState<Pagamento>("dinheiro");
  const [fechando, setFechando] = useState(querFechar);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categorias = [...new Set(itensCardapio.map((i) => i.categoria))];
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0] ?? "");
  const [aba, setAba] = useState<"cardapio" | "novos">("cardapio");

  const draftTotal = draft.reduce((s, i) => s + i.preco * i.qtd, 0);
  const draftQtd = draft.reduce((s, i) => s + i.qtd, 0);

  function addItem(item: ItemCardapio) {
    setDraft((prev) => {
      const existente = prev.find((i) => i.itemCardapioId === item.id);
      if (existente) return prev.map((i) => (i.itemCardapioId === item.id ? { ...i, qtd: i.qtd + 1 } : i));
      return [...prev, { itemCardapioId: item.id, nome: item.nome, preco: item.preco, qtd: 1 }];
    });
  }

  function changeQty(idx: number, delta: number) {
    setDraft((prev) => {
      const qtd = prev[idx].qtd + delta;
      if (qtd <= 0) return prev.filter((_, i) => i !== idx);
      return prev.map((i, i2) => (i2 === idx ? { ...i, qtd } : i));
    });
  }

  function enviar() {
    setErro(null);
    startTransition(async () => {
      try {
        await enviarComandaParaCozinha(
          mesa,
          draft.map((i) => ({ itemCardapioId: i.itemCardapioId, nome: i.nome, preco: i.preco, quantidade: i.qtd })),
        );
        setDraft([]);
        setAba("cardapio");
        router.refresh();
        onClose();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra enviar.");
      }
    });
  }

  function confirmarFechamento() {
    startTransition(async () => {
      await fecharMesaAction(mesa, pagamento);
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {fechando ? (
          <>
            <DialogHeader className="p-4">
              <DialogTitle>Fechar Mesa {mesa}</DialogTitle>
            </DialogHeader>
            {querFechar && (
              <p className="mx-4 mb-2 rounded-lg bg-status-warn-bg px-3 py-2 text-sm font-medium text-status-warn-fg">
                O cliente pediu pra fechar a conta pelo celular.
              </p>
            )}
            <div className="flex flex-col gap-4 px-4">
              <p className="text-sm text-muted-foreground">Como o cliente vai pagar?</p>
              <div className="flex gap-2">
                {(["dinheiro", "cartao", "pix"] as Pagamento[]).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={pagamento === p ? "default" : "outline"}
                    onClick={() => setPagamento(p)}
                    className="capitalize"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
              <Button disabled={pending} onClick={confirmarFechamento}>
                {pending ? "Fechando…" : "Confirmar pagamento e liberar mesa"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="p-4">
              <DialogTitle>Mesa {mesa}</DialogTitle>
            </DialogHeader>
            {querFechar && (
              <button
                type="button"
                onClick={() => setFechando(true)}
                className="mx-4 mb-2 flex items-center justify-between rounded-lg bg-status-warn-bg px-3 py-2 text-left text-sm font-medium text-status-warn-fg"
              >
                O cliente pediu pra fechar a conta
                <span className="underline">Fechar agora</span>
              </button>
            )}

            <Tabs value={aba} onValueChange={(v) => v && setAba(v as typeof aba)} className="flex flex-1 flex-col gap-0 overflow-hidden">
              <div className="px-4">
                <TabsList className="w-full">
                  <TabsTrigger value="cardapio" className="flex-1">
                    Cardápio
                  </TabsTrigger>
                  <TabsTrigger value="novos" className="flex-1 gap-1.5">
                    Itens a enviar
                    {draftQtd > 0 && <Badge className="bg-primary text-primary-foreground">{draftQtd}</Badge>}
                  </TabsTrigger>
                </TabsList>
              </div>

              {draftQtd > 0 && aba === "cardapio" && (
                <button
                  type="button"
                  onClick={() => setAba("novos")}
                  className="mx-4 mt-3 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="size-4" /> {draftQtd} {draftQtd === 1 ? "item" : "itens"} pra enviar
                  </span>
                  <span className="num">{fmtBRL(draftTotal)}</span>
                </button>
              )}

              <TabsContent value="cardapio" className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
                {pedidosAbertos.length > 0 && (
                  <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Já enviado pra cozinha
                    </p>
                    {pedidosAbertos.map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-sm">
                        <span>{o.itemCount} item(ns)</span>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={o.status} />
                          <a href={`/imprimir/${o.id}`} target="_blank" rel="noopener noreferrer">
                            <Button size="icon-sm" variant="outline" aria-label="Imprimir comanda">
                              <Printer />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-3 flex flex-wrap gap-2">
                  {categorias.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaAtiva(cat)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        categoriaAtiva === cat
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col divide-y divide-border">
                  {itensCardapio
                    .filter((i) => i.categoria === categoriaAtiva)
                    .map((it) => {
                      const noDraft = draft.find((d) => d.itemCardapioId === it.id);
                      return (
                        <div key={it.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div>
                            <div className="text-sm font-medium">{it.nome}</div>
                            <div className="num text-xs text-muted-foreground">{fmtBRL(it.preco)}</div>
                          </div>
                          <Button
                            size="sm"
                            variant={noDraft ? "default" : "outline"}
                            onClick={() => addItem(it)}
                          >
                            <Plus /> {noDraft ? `${noDraft.qtd}x adicionado` : "adicionar"}
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </TabsContent>

              <TabsContent value="novos" className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
                <p className="mb-3 text-xs text-muted-foreground">
                  Itens selecionados agora, ainda não enviados pra cozinha.
                </p>
                {draft.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                    <ShoppingBag className="size-8" />
                    <p className="text-sm">Nenhum item selecionado ainda.</p>
                    <Button size="sm" variant="outline" onClick={() => setAba("cardapio")}>
                      Ver cardápio
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3">
                      {draft.map((i, idx) => (
                        <div
                          key={i.itemCardapioId}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                        >
                          <div>
                            <div className="text-sm font-medium">{i.nome}</div>
                            <div className="num text-xs text-muted-foreground">{fmtBRL(i.preco)} cada</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon-sm" variant="outline" onClick={() => changeQty(idx, -1)}>
                              <Minus />
                            </Button>
                            <span className="num w-6 text-center font-medium">{i.qtd}</span>
                            <Button size="icon-sm" variant="outline" onClick={() => changeQty(idx, 1)}>
                              <Plus />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-between border-t border-border pt-3 text-base font-semibold">
                      <span>Total a enviar</span>
                      <span className="num">{fmtBRL(draftTotal)}</span>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            {erro && <p className="px-4 text-sm text-destructive">{erro}</p>}

            <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
              <Button disabled={draft.length === 0 || pending} onClick={enviar}>
                {pending
                  ? "Enviando…"
                  : draftQtd > 0
                    ? `Enviar pra cozinha · ${fmtBRL(draftTotal)}`
                    : "Enviar pra cozinha"}
              </Button>
              {pedidosAbertos.length > 0 && (
                <Button variant="outline" onClick={() => setFechando(true)}>
                  Fechar mesa e cobrar
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
