"use client";

import { Receipt, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { solicitarFechamentoMesa } from "@/actions/pedidos.actions";
import CartDrawer from "@/components/CartDrawer";
import { ItemCard, tintDaCategoria, type ItemDoCardapio } from "@/components/CardapioItemCard";
import CustomerHeader from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { fmtBRL } from "@/lib/data";
import { useCart } from "@/lib/cart";

export interface ItemDaContaMesa {
  nome: string;
  preco: number;
  quantidade: number;
}

type Aba = "cardapio" | "comanda";

/** Versão do cardápio pro cliente que escaneou o QR code na mesa — barra
 * inferior fixa como um app, alternando entre o cardápio (pra pedir) e a
 * comanda (pra ver o que já pediu, o total, e avisar que quer pagar). Sem
 * login, sem entrega, sem pagamento online — isso continua na mão de quem
 * atende (ver criarPedidoMesa / solicitarFechamentoMesa). */
export default function CardapioMesaClient({
  restauranteId,
  mesa,
  nomeRestaurante,
  itensPorCategoria,
  contaAtual,
  fechamentoJaSolicitado = false,
}: {
  restauranteId: string;
  mesa: number;
  nomeRestaurante?: string;
  itensPorCategoria: Record<string, ItemDoCardapio[]>;
  contaAtual: { itens: ItemDaContaMesa[]; total: number };
  fechamentoJaSolicitado?: boolean;
}) {
  const categorias = Object.keys(itensPorCategoria);
  const [aba, setAba] = useState<Aba>("cardapio");
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0] ?? "");
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [solicitado, setSolicitado] = useState(fechamentoJaSolicitado);
  const [pending, startTransition] = useTransition();
  const { total, count } = useCart();

  const itensPorId: Record<string, ItemDoCardapio> = {};
  for (const lista of Object.values(itensPorCategoria)) {
    for (const item of lista) itensPorId[item.id] = item;
  }

  const banerRef = useRef<HTMLDivElement>(null);
  const pillBarRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [topoFixo, setTopoFixo] = useState(88);

  useEffect(() => {
    setTopoFixo(56 + (banerRef.current?.offsetHeight ?? 32));
  }, []);

  useEffect(() => {
    if (aba !== "cardapio") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cat = entry.target.getAttribute("data-categoria");
            if (cat) setCategoriaAtiva(cat);
          }
        }
      },
      { rootMargin: "-160px 0px -70% 0px", threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, categorias.join("|")]);

  useEffect(() => {
    pillRefs.current[categoriaAtiva]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [categoriaAtiva]);

  function irParaCategoria(cat: string) {
    const el = sectionRefs.current[cat];
    if (!el) return;
    const offset = topoFixo + (pillBarRef.current?.offsetHeight ?? 0) + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  function pedirFechamento() {
    startTransition(async () => {
      await solicitarFechamentoMesa(restauranteId, mesa);
      setSolicitado(true);
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CustomerHeader nomeRestaurante={nomeRestaurante} />

      <div ref={banerRef} className="bg-primary px-4 py-1.5 text-center text-xs font-semibold text-primary-foreground">
        Pedindo para a Mesa {mesa}
      </div>

      {aba === "cardapio" ? (
        categorias.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">O cardápio ainda não tem itens cadastrados.</p>
          </div>
        ) : (
          <>
            <div ref={pillBarRef} className="sticky z-30 border-b border-border bg-background" style={{ top: topoFixo }}>
              <div className="mx-auto flex max-w-2xl gap-5 overflow-x-auto px-4 md:px-6">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    ref={(el) => {
                      pillRefs.current[cat] = el;
                    }}
                    type="button"
                    onClick={() => irParaCategoria(cat)}
                    className={`shrink-0 whitespace-nowrap border-b-2 py-3 text-sm transition-colors ${
                      categoriaAtiva === cat
                        ? "border-primary font-semibold text-primary"
                        : "border-transparent font-medium text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className={`mx-auto w-full max-w-2xl flex-1 px-4 md:px-6 ${count ? "pb-40" : "pb-24"}`}>
              {categorias.map((cat) => (
                <div
                  key={cat}
                  ref={(el) => {
                    sectionRefs.current[cat] = el;
                  }}
                  data-categoria={cat}
                >
                  <h2 className="pt-5 font-heading text-lg font-semibold">{cat}</h2>
                  <div className="flex flex-col">
                    {itensPorCategoria[cat]?.map((item) => (
                      <ItemCard key={item.id} item={item} categoria={cat} tint={tintDaCategoria(cat, categorias)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-5 pb-24 md:px-6">
          <h2 className="font-heading text-lg font-semibold">Sua conta</h2>

          {contaAtual.itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada pedido ainda nessa mesa.</p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
                {contaAtual.itens.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantidade}x {item.nome}
                    </span>
                    <span className="num">{fmtBRL(item.preco * item.quantidade)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="num">{fmtBRL(contaAtual.total)}</span>
                </div>
              </div>

              {solicitado ? (
                <p className="rounded-lg bg-status-ok-bg px-3 py-2 text-center text-sm font-medium text-status-ok-fg">
                  Chamamos o atendimento! Já já alguém vem até a mesa.
                </p>
              ) : (
                <Button disabled={pending} onClick={pedirFechamento}>
                  {pending ? "Chamando…" : "Fechar a conta"}
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col">
        {aba === "cardapio" && count > 0 && (
          <div className="border-t border-border bg-background p-3">
            <button
              type="button"
              onClick={() => setSacolaAberta(true)}
              className="mx-auto flex w-full max-w-lg items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <ShoppingBag className="size-4" /> Ver sacola · {count} {count === 1 ? "item" : "itens"}
              </span>
              <span className="num text-sm font-bold">{fmtBRL(total)}</span>
            </button>
          </div>
        )}

        <nav className="border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)]">
          <div className="mx-auto flex max-w-lg items-stretch justify-around">
            <button
              type="button"
              onClick={() => setAba("cardapio")}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                aba === "cardapio" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <UtensilsCrossed className="size-5" />
              Cardápio
            </button>
            <button
              type="button"
              onClick={() => setAba("comanda")}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                aba === "comanda" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Receipt className="size-5" />
              {contaAtual.itens.length > 0 ? `Comanda · ${fmtBRL(contaAtual.total)}` : "Comanda"}
            </button>
          </div>
        </nav>
      </div>

      <CartDrawer
        restauranteId={restauranteId}
        zonasEntrega={[]}
        enderecoLoja={null}
        itensPorId={itensPorId}
        open={sacolaAberta}
        onOpenChange={setSacolaAberta}
        mesa={mesa}
      />
    </div>
  );
}
