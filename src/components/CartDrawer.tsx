"use client";

import { Show, SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Bike, Loader2, Minus, Pencil, Plus, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { criarPedidoCliente } from "@/actions/pedidos.actions";
import { calcularEntregaReal } from "@/actions/entrega.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ItemDetalheDialog from "@/components/ItemDetalheDialog";
import type { ItemDoCardapio, ZonaEntregaResumo } from "@/components/CardapioClient";
import { fmtBRL } from "@/lib/data";
import { encontrarZona } from "@/lib/entrega";
import type { DistanciaReal } from "@/lib/googleMaps";
import { useCart, type CartItem } from "@/lib/cart";
import type { Pagamento } from "@/lib/types";

type Passo = "carrinho" | "entrega" | "pagamento" | "confirmado";
type Tipo = "retirada" | "delivery";

const STORAGE_KEY = "dashi-sushi-checkout-v1";

interface DadosEntrega {
  telefone: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  referencia: string;
}

const ENTREGA_VAZIA: DadosEntrega = { telefone: "", rua: "", numero: "", complemento: "", bairro: "", referencia: "" };

function montarEndereco(d: DadosEntrega): string {
  let linha = `${d.rua.trim()}, ${d.numero.trim()}`;
  if (d.complemento.trim()) linha += ` - ${d.complemento.trim()}`;
  linha += ` - ${d.bairro.trim()}`;
  if (d.referencia.trim()) linha += ` (Ref: ${d.referencia.trim()})`;
  return linha;
}

export default function CartDrawer({
  restauranteId,
  zonasEntrega,
  enderecoLoja,
  itensPorId,
  open,
  onOpenChange,
}: {
  restauranteId: string;
  zonasEntrega: ZonaEntregaResumo[];
  enderecoLoja: string | null;
  itensPorId: Record<string, ItemDoCardapio>;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { items, total, setQty, clear } = useCart();
  const { user } = useUser();

  const [passo, setPasso] = useState<Passo>("carrinho");
  const [tipo, setTipo] = useState<Tipo>("delivery");
  const [entrega, setEntrega] = useState<DadosEntrega>(ENTREGA_VAZIA);
  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState<CartItem | null>(null);
  const [distanciaReal, setDistanciaReal] = useState<DistanciaReal | null>(null);
  const [calculandoDistancia, setCalculandoDistancia] = useState(false);

  const zonaEncontrada = useMemo(
    () => (tipo === "delivery" ? encontrarZona(zonasEntrega, entrega.bairro) : null),
    [tipo, zonasEntrega, entrega.bairro],
  );
  const taxaEntrega = tipo === "delivery" ? (zonaEncontrada?.taxaEntrega ?? 0) : 0;
  const totalComEntrega = total + taxaEntrega;

  const enderecoDestino =
    tipo === "delivery" && entrega.rua.trim() && entrega.numero.trim() && entrega.bairro.trim()
      ? `${entrega.rua}, ${entrega.numero} - ${entrega.bairro}`
      : "";

  // Distância/tempo reais (Google Maps) — só dispara quando a rua, número e
  // bairro estão preenchidos, com debounce pra não bater na API a cada
  // letra digitada. Sem GOOGLE_MAPS_API_KEY configurada, a action devolve
  // null e a tela mantém o tempo estimado manual da zona.
  useEffect(() => {
    if (!enderecoDestino || !enderecoLoja) {
      setDistanciaReal(null);
      return;
    }
    setCalculandoDistancia(true);
    const id = setTimeout(() => {
      calcularEntregaReal(restauranteId, enderecoDestino)
        .then(setDistanciaReal)
        .catch(() => setDistanciaReal(null))
        .finally(() => setCalculandoDistancia(false));
    }, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enderecoDestino, enderecoLoja, restauranteId]);

  const mapaUrl =
    enderecoLoja && enderecoDestino
      ? `https://maps.google.com/maps?saddr=${encodeURIComponent(enderecoLoja)}&daddr=${encodeURIComponent(enderecoDestino)}&z=13&output=embed`
      : null;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntrega((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {
      // sem dado salvo, começa em branco
    }
  }, []);

  function atualizarEntrega(campo: keyof DadosEntrega, valor: string) {
    setEntrega((prev) => ({ ...prev, [campo]: valor }));
  }

  function irParaEntrega() {
    setErro(null);
    setPasso("entrega");
  }

  function confirmarEntrega() {
    if (!entrega.telefone.trim()) {
      setErro("Informe um telefone pra contato.");
      return;
    }
    if (tipo === "delivery" && (!entrega.rua.trim() || !entrega.numero.trim() || !entrega.bairro.trim())) {
      setErro("Preencha rua, número e bairro.");
      return;
    }
    setErro(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entrega));
    } catch {
      // localStorage indisponível, segue sem salvar
    }
    setPasso("pagamento");
  }

  function confirmarPagamento() {
    setErro(null);
    const cliente = user?.fullName || user?.username || "Cliente do site";
    const enderecoFinal = tipo === "retirada" ? "Retirada no balcão" : montarEndereco(entrega);
    startTransition(async () => {
      try {
        const { pedidoId } = await criarPedidoCliente({
          restauranteId,
          itens: items.map((i) => ({
            itemCardapioId: i.itemCardapioId,
            quantidade: i.qtd,
            observacao: i.escolhas?.length ? i.escolhas.map((e) => `${e.quantidade}x ${e.nome}`).join(", ") : null,
          })),
          endereco: enderecoFinal,
          bairro: tipo === "delivery" ? entrega.bairro : null,
          telefone: entrega.telefone,
          pagamento,
          clienteNome: cliente,
        });
        setPedidoId(pedidoId);
        clear();
        setPasso("confirmado");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra confirmar o pedido.");
      }
    });
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v && passo === "confirmado") {
      setTimeout(() => setPasso("carrinho"), 300);
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="p-4">
          <DialogTitle>
            {passo === "carrinho" && "Sua sacola"}
            {passo === "entrega" && "Dados de entrega"}
            {passo === "pagamento" && "Pagamento"}
            {passo === "confirmado" && "Pedido confirmado"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
          {passo === "carrinho" && (
            <>
              <div className="flex flex-col gap-3">
                {items.length === 0 && <p className="text-sm text-muted-foreground">Sua sacola está vazia.</p>}
                {items.map((i) => (
                  <div key={i.cartItemId} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span>
                        {i.qtd}x {i.nome}
                      </span>
                      {i.escolhas && i.escolhas.length > 0 && (
                        <>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {i.escolhas.map((e) => `${e.quantidade}x ${e.nome}`).join(", ")}
                          </p>
                          <button
                            type="button"
                            onClick={() => setEditando(i)}
                            className="mt-0.5 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <Pencil className="size-3" /> Editar peças
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="icon-sm" variant="outline" onClick={() => setQty(i.cartItemId, i.qtd - 1)}>
                        <Minus />
                      </Button>
                      <span className="num w-16 text-right">{fmtBRL(i.preco * i.qtd)}</span>
                      <Button size="icon-sm" variant="outline" onClick={() => setQty(i.cartItemId, i.qtd + 1)}>
                        <Plus />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {items.length > 0 && (
                <>
                  <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
                    <span>Total</span>
                    <span className="num">{fmtBRL(total)}</span>
                  </div>

                  <Show when="signed-in">
                    <Button className="w-full" onClick={irParaEntrega}>
                      Continuar
                    </Button>
                  </Show>
                  <Show when="signed-out">
                    <p className="text-xs text-muted-foreground">Entre com sua conta pra finalizar o pedido.</p>
                    <SignInButton mode="modal">
                      <Button className="w-full">Entrar e continuar</Button>
                    </SignInButton>
                  </Show>
                </>
              )}
            </>
          )}

          {passo === "entrega" && (
            <>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Como vai ser?
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant={tipo === "delivery" ? "default" : "outline"} onClick={() => setTipo("delivery")}>
                    🛵 Delivery
                  </Button>
                  <Button size="sm" variant={tipo === "retirada" ? "default" : "outline"} onClick={() => setTipo("retirada")}>
                    🏠 Retirar no local
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="telefone">Telefone pra contato</Label>
                <Input
                  id="telefone"
                  value={entrega.telefone}
                  onChange={(e) => atualizarEntrega("telefone", e.target.value)}
                  placeholder="(27) 99999-9999"
                  inputMode="tel"
                />
              </div>

              {tipo === "delivery" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Endereço de entrega
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <Label htmlFor="rua">Rua / Avenida</Label>
                      <Input id="rua" value={entrega.rua} onChange={(e) => atualizarEntrega("rua", e.target.value)} placeholder="Rua das Palmeiras" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="numero">Número</Label>
                      <Input id="numero" value={entrega.numero} onChange={(e) => atualizarEntrega("numero", e.target.value)} placeholder="120" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" value={entrega.bairro} onChange={(e) => atualizarEntrega("bairro", e.target.value)} placeholder="Centro" />
                  </div>

                  {entrega.bairro.trim() && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                      {calculandoDistancia ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <Bike className="size-4 shrink-0 text-primary" />
                      )}
                      {calculandoDistancia ? (
                        <span className="text-muted-foreground">Calculando distância…</span>
                      ) : distanciaReal ? (
                        <span>
                          <strong>{distanciaReal.distanciaKm} km</strong> · Chega em{" "}
                          <strong>{distanciaReal.duracaoMin} min</strong>
                          {zonaEncontrada && (
                            <>
                              {" "}
                              · Taxa <span className="num">{fmtBRL(zonaEncontrada.taxaEntrega)}</span>
                            </>
                          )}
                        </span>
                      ) : zonaEncontrada ? (
                        <span>
                          Chega em <strong>{zonaEncontrada.tempoEstimadoMin} min</strong> · Taxa{" "}
                          <span className="num">{fmtBRL(zonaEncontrada.taxaEntrega)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Taxa de entrega a combinar pra esse bairro.</span>
                      )}
                    </div>
                  )}

                  {mapaUrl && (
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-border">
                      <iframe title="Rota de entrega" className="size-full" loading="lazy" src={mapaUrl} />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="complemento">Complemento (opcional)</Label>
                    <Input
                      id="complemento"
                      value={entrega.complemento}
                      onChange={(e) => atualizarEntrega("complemento", e.target.value)}
                      placeholder="Apto, bloco, casa dos fundos…"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="referencia">Ponto de referência (opcional)</Label>
                    <Input
                      id="referencia"
                      value={entrega.referencia}
                      onChange={(e) => atualizarEntrega("referencia", e.target.value)}
                      placeholder="Perto do mercado tal…"
                    />
                  </div>
                </div>
              )}

              {erro && <p className="text-sm text-destructive">{erro}</p>}
            </>
          )}

          {passo === "pagamento" && (
            <>
              <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3 text-sm">
                {items.map((i) => (
                  <div key={i.cartItemId} className="flex justify-between text-muted-foreground">
                    <div>
                      <span>
                        {i.qtd}x {i.nome}
                      </span>
                      {i.escolhas && i.escolhas.length > 0 && (
                        <p className="text-xs">{i.escolhas.map((e) => `${e.quantidade}x ${e.nome}`).join(", ")}</p>
                      )}
                    </div>
                    <span className="num">{fmtBRL(i.preco * i.qtd)}</span>
                  </div>
                ))}
                {tipo === "delivery" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxa de entrega</span>
                    <span className="num">{taxaEntrega > 0 ? fmtBRL(taxaEntrega) : "A combinar"}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                  <span>Total</span>
                  <span className="num">{fmtBRL(totalComEntrega)}</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Forma de pagamento
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant={pagamento === "pix" ? "default" : "outline"} onClick={() => setPagamento("pix")}>
                    Pix
                  </Button>
                  <Button size="sm" variant={pagamento === "cartao" ? "default" : "outline"} onClick={() => setPagamento("cartao")}>
                    Cartão
                  </Button>
                  <Button size="sm" variant={pagamento === "dinheiro" ? "default" : "outline"} onClick={() => setPagamento("dinheiro")}>
                    Dinheiro
                  </Button>
                </div>
              </div>

              {pagamento === "pix" && (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center">
                  <div
                    className="h-36 w-36 rounded-lg"
                    style={{
                      background:
                        "repeating-conic-gradient(var(--foreground) 0% 25%, var(--card) 0% 50%) 0 0/20px 20px",
                    }}
                  />
                  <p className="text-xs text-muted-foreground">QR Code de exemplo — pagamento simulado</p>
                </div>
              )}

              {pagamento === "cartao" && (
                <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
                  <Input placeholder="Número do cartão (demo)" disabled />
                  <div className="flex gap-3">
                    <Input placeholder="Validade" disabled />
                    <Input placeholder="CVV" disabled />
                  </div>
                </div>
              )}

              {pagamento === "dinheiro" && (
                <p className="rounded-xl border border-border p-4 text-center text-sm text-muted-foreground">
                  Pague em dinheiro na hora da {tipo === "retirada" ? "retirada" : "entrega"}.
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Pagamento simulado nessa demonstração — a cobrança real via Asaas entra na próxima etapa do projeto.
              </p>

              {erro && <p className="text-sm text-destructive">{erro}</p>}
            </>
          )}

          {passo === "confirmado" && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="text-4xl">🍣</div>
              <h3 className="font-heading text-lg font-semibold">Pedido #{pedidoId?.slice(0, 8)} recebido!</h3>
              <p className="text-sm text-muted-foreground">
                Já mandamos pra cozinha. Acompanhe o status do seu pedido em tempo real.
              </p>
            </div>
          )}
        </div>

        {passo === "entrega" && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <Button onClick={confirmarEntrega}>Continuar pro pagamento</Button>
            <Button variant="outline" onClick={() => setPasso("carrinho")}>
              Voltar
            </Button>
          </div>
        )}
        {passo === "pagamento" && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <Button disabled={pending} onClick={confirmarPagamento}>
              {pending ? "Confirmando…" : "Confirmar pedido"}
            </Button>
            <Button variant="outline" onClick={() => setPasso("entrega")}>
              Voltar
            </Button>
          </div>
        )}
        {passo === "confirmado" && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            {pedidoId && (
              <Link href={`/pedido/${pedidoId}`} className="w-full">
                <Button className="w-full">Acompanhar pedido</Button>
              </Link>
            )}
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <ItemDetalheDialog
      item={editando ? (itensPorId[editando.itemCardapioId] ?? null) : null}
      tint="bg-status-neutral-bg text-status-neutral-fg"
      icon={UtensilsCrossed}
      open={!!editando}
      onOpenChange={(v) => !v && setEditando(null)}
      edicao={editando ? { cartItemId: editando.cartItemId, escolhasIniciais: editando.escolhas ?? [] } : undefined}
    />
    </>
  );
}
