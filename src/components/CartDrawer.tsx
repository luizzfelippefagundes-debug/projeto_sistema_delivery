"use client";

import { Show, SignInButton, useUser } from "@clerk/nextjs";
import { Minus, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { criarPedidoCliente } from "@/actions/pedidos.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fmtBRL } from "@/lib/data";
import { useCart } from "@/lib/cart";
import type { Pagamento } from "@/lib/types";

type Passo = "carrinho" | "pagamento" | "confirmado";
type Tipo = "retirada" | "delivery";

export default function CartDrawer({
  restauranteId,
  open,
  onOpenChange,
}: {
  restauranteId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { items, total, setQty, clear } = useCart();
  const { user } = useUser();

  const [passo, setPasso] = useState<Passo>("carrinho");
  const [tipo, setTipo] = useState<Tipo>("delivery");
  const [endereco, setEndereco] = useState("");
  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmarPagamento() {
    setErro(null);
    const cliente = user?.fullName || user?.username || "Cliente do site";
    const enderecoFinal = tipo === "retirada" ? "Retirada no balcão" : endereco || "Endereço não informado";
    startTransition(async () => {
      try {
        const { pedidoId } = await criarPedidoCliente({
          restauranteId,
          itens: items.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.qtd })),
          endereco: enderecoFinal,
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {passo === "carrinho" && "Sua sacola"}
            {passo === "pagamento" && "Pagamento"}
            {passo === "confirmado" && "Pedido confirmado"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
          {passo === "carrinho" && (
            <>
              <div className="flex flex-col gap-2">
                {items.length === 0 && <p className="text-sm text-muted-foreground">Sua sacola está vazia.</p>}
                {items.map((i) => (
                  <div key={i.itemCardapioId} className="flex items-center justify-between text-sm">
                    <span>
                      {i.qtd}x {i.nome}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="icon-sm" variant="outline" onClick={() => setQty(i.itemCardapioId, i.qtd - 1)}>
                        <Minus />
                      </Button>
                      <span className="num w-16 text-right">{fmtBRL(i.preco * i.qtd)}</span>
                      <Button size="icon-sm" variant="outline" onClick={() => setQty(i.itemCardapioId, i.qtd + 1)}>
                        <Plus />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {items.length > 0 && (
                <>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Como vai ser?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={tipo === "delivery" ? "default" : "outline"}
                        onClick={() => setTipo("delivery")}
                      >
                        🛵 Delivery
                      </Button>
                      <Button
                        size="sm"
                        variant={tipo === "retirada" ? "default" : "outline"}
                        onClick={() => setTipo("retirada")}
                      >
                        🏠 Retirar no local
                      </Button>
                    </div>
                  </div>

                  {tipo === "delivery" && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Endereço de entrega
                      </p>
                      <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro" />
                    </div>
                  )}

                  <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
                    <span>Total</span>
                    <span className="num">{fmtBRL(total)}</span>
                  </div>

                  <Show when="signed-in">
                    <Button className="w-full" disabled={tipo === "delivery" && !endereco.trim()} onClick={() => setPasso("pagamento")}>
                      Continuar pro pagamento
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

          {passo === "pagamento" && (
            <>
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

              <p className="text-xs text-muted-foreground">
                Pagamento simulado nessa demonstração — a cobrança real via Asaas entra na próxima etapa do projeto.
              </p>

              {erro && <p className="text-sm text-destructive">{erro}</p>}

              <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
                <span>Total a pagar</span>
                <span className="num">{fmtBRL(total)}</span>
              </div>
            </>
          )}

          {passo === "confirmado" && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="text-4xl">🍣</div>
              <h3 className="font-heading text-lg font-semibold">Pedido #{pedidoId} recebido!</h3>
              <p className="text-sm text-muted-foreground">
                Já mandamos pra cozinha. Você pode acompanhar o preparo pelo painel da equipe.
              </p>
            </div>
          )}
        </div>

        {passo === "pagamento" && (
          <SheetFooter>
            <Button disabled={pending} onClick={confirmarPagamento}>
              {pending ? "Confirmando…" : "Confirmar pagamento"}
            </Button>
            <Button variant="outline" onClick={() => setPasso("carrinho")}>
              Voltar
            </Button>
          </SheetFooter>
        )}
        {passo === "confirmado" && (
          <SheetFooter>
            <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
