"use client";

import { CupSoda, Fish, Minus, Package, Plus, Sandwich, Soup, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import ItemDetalheDialog from "@/components/ItemDetalheDialog";
import { fmtBRL } from "@/lib/data";
import { useCart } from "@/lib/cart";

export const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Combos: Package,
  Temaki: Sandwich,
  "Peças avulsas": Fish,
  Porções: Soup,
  Yakisoba: UtensilsCrossed,
  Bebidas: CupSoda,
};
export const ICON_PADRAO = UtensilsCrossed;

const CATEGORY_TINT = [
  "bg-status-danger-bg text-status-danger-fg",
  "bg-status-neutral-bg text-status-neutral-fg",
  "bg-status-warn-bg text-status-warn-fg",
  "bg-status-ok-bg text-status-ok-fg",
];

export function tintDaCategoria(categoria: string, categorias: string[]) {
  const idx = categorias.indexOf(categoria);
  return CATEGORY_TINT[idx % CATEGORY_TINT.length];
}

export interface ItemDoCardapio {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
  qtdPecasEscolha: number | null;
  opcoes: { id: string; nome: string; limiteQuantidade: number | null }[];
}

/** Card de um item do cardápio — usado tanto no cardápio de delivery
 * (CardapioClient) quanto no de mesa (CardapioMesaClient), pra manter os
 * dois com a mesma cara sem duplicar a lógica de carrinho/combo. */
export function ItemCard({ item, categoria, tint }: { item: ItemDoCardapio; categoria: string; tint: string }) {
  const { items, add, setQty } = useCart();
  const Icon = CATEGORY_ICON[categoria] ?? ICON_PADRAO;
  const ehCombo = item.qtdPecasEscolha != null && item.opcoes.length > 0;
  const noCarrinho = items.find((i) => i.itemCardapioId === item.id && !i.escolhas);
  const [detalheAberto, setDetalheAberto] = useState(false);

  return (
    <>
      <div
        className="flex cursor-pointer items-start gap-3 border-b border-border py-4 last:border-0"
        onClick={() => setDetalheAberto(true)}
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-medium leading-snug">{item.nome}</h3>
          {item.descricao && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.descricao}</p>
          )}
          <p className="num mt-2 text-sm font-semibold">{fmtBRL(item.preco)}</p>
        </div>

        <div className="relative size-24 shrink-0 sm:size-28">
          <div className="size-full overflow-hidden rounded-xl">
            {item.imagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imagemUrl} alt={item.nome} className="size-full object-cover" />
            ) : (
              <div className={`flex size-full items-center justify-center ${tint}`}>
                <Icon className="size-7" />
              </div>
            )}
          </div>

          {!ehCombo && noCarrinho ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute -bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card px-1 py-1 shadow-md"
            >
              <button
                type="button"
                onClick={() => setQty(noCarrinho.cartItemId, noCarrinho.qtd - 1)}
                aria-label="Diminuir quantidade"
                className="flex size-6 items-center justify-center rounded-full text-foreground hover:bg-muted"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="num w-3 text-center text-xs font-semibold">{noCarrinho.qtd}</span>
              <button
                type="button"
                onClick={() => setQty(noCarrinho.cartItemId, noCarrinho.qtd + 1)}
                aria-label="Aumentar quantidade"
                className="flex size-6 items-center justify-center rounded-full text-foreground hover:bg-muted"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (ehCombo) setDetalheAberto(true);
                else add(item.id, item.nome, item.preco);
              }}
              aria-label="Adicionar"
              className="absolute -bottom-2 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
      </div>

      <ItemDetalheDialog item={item} tint={tint} icon={Icon} open={detalheAberto} onOpenChange={setDetalheAberto} />
    </>
  );
}
