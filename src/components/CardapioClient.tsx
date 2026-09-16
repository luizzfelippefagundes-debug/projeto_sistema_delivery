"use client";

import { CupSoda, Fish, Minus, Package, Plus, Sandwich, ShoppingBag, Soup, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import CustomerHeader from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { fmtBRL } from "@/lib/data";
import { useCart } from "@/lib/cart";

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Combos: Package,
  Temaki: Sandwich,
  "Peças avulsas": Fish,
  Porções: Soup,
  Yakisoba: UtensilsCrossed,
  Bebidas: CupSoda,
};
const ICON_PADRAO = UtensilsCrossed;

const CATEGORY_TINT = [
  "bg-status-danger-bg text-status-danger-fg",
  "bg-status-neutral-bg text-status-neutral-fg",
  "bg-status-warn-bg text-status-warn-fg",
  "bg-status-ok-bg text-status-ok-fg",
];

function tintDaCategoria(categoria: string, categorias: string[]) {
  const idx = categorias.indexOf(categoria);
  return CATEGORY_TINT[idx % CATEGORY_TINT.length];
}

export interface ItemDoCardapio {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
}

function ItemCard({ item, categoria, tint }: { item: ItemDoCardapio; categoria: string; tint: string }) {
  const { items, add, setQty } = useCart();
  const Icon = CATEGORY_ICON[categoria] ?? ICON_PADRAO;
  const noCarrinho = items.find((i) => i.itemCardapioId === item.id);

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0">
      <div className={`flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-24 ${item.imagemUrl ? "" : tint}`}>
        {item.imagemUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imagemUrl} alt={item.nome} className="size-full rounded-xl object-cover" />
        ) : (
          <Icon className="size-7" />
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div>
          <h3 className="font-medium leading-snug">{item.nome}</h3>
          {item.descricao && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.descricao}</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="num text-sm font-semibold">{fmtBRL(item.preco)}</span>
          {noCarrinho ? (
            <div className="flex items-center gap-2">
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => setQty(item.id, noCarrinho.qtd - 1)}
                aria-label="Diminuir quantidade"
              >
                <Minus />
              </Button>
              <span className="num w-4 text-center text-sm font-semibold">{noCarrinho.qtd}</span>
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => setQty(item.id, noCarrinho.qtd + 1)}
                aria-label="Aumentar quantidade"
              >
                <Plus />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => add(item.id, item.nome, item.preco)}>
              <Plus /> Adicionar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CardapioClient({
  restauranteId,
  nomeRestaurante,
  itensPorCategoria,
}: {
  restauranteId: string;
  nomeRestaurante?: string;
  itensPorCategoria: Record<string, ItemDoCardapio[]>;
}) {
  const categorias = Object.keys(itensPorCategoria);
  const [categoria, setCategoria] = useState(categorias[0] ?? "");
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const { total, count } = useCart();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CustomerHeader nomeRestaurante={nomeRestaurante} />

      {categorias.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">O cardápio ainda não tem itens cadastrados.</p>
        </div>
      ) : (
        <>
          <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-3 md:px-6">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    categoria === cat
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className={`mx-auto w-full max-w-2xl flex-1 px-4 md:px-6 ${count ? "pb-24 lg:pb-8" : "pb-8"}`}>
            <h2 className="pt-5 font-heading text-lg font-semibold">{categoria}</h2>
            <div className="flex flex-col">
              {itensPorCategoria[categoria]?.map((item) => (
                <ItemCard key={item.id} item={item} categoria={categoria} tint={tintDaCategoria(categoria, categorias)} />
              ))}
            </div>
          </div>
        </>
      )}

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background p-3">
          <button
            type="button"
            onClick={() => setSacolaAberta(true)}
            className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="size-4" /> Ver sacola · {count} {count === 1 ? "item" : "itens"}
            </span>
            <span className="num text-sm font-bold">{fmtBRL(total)}</span>
          </button>
        </div>
      )}

      <CartDrawer restauranteId={restauranteId} open={sacolaAberta} onOpenChange={setSacolaAberta} />
    </div>
  );
}
