"use client";

import { CupSoda, Fish, Minus, Package, Plus, Sandwich, ShoppingBag, Soup, UtensilsCrossed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import CustomerHeader from "@/components/CustomerHeader";
import CustomerTabBar from "@/components/CustomerTabBar";
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
    <div className="flex items-start gap-3 border-b border-border py-4 last:border-0">
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

        {noCarrinho ? (
          <div className="absolute -bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card px-1 py-1 shadow-md">
            <button
              type="button"
              onClick={() => setQty(item.id, noCarrinho.qtd - 1)}
              aria-label="Diminuir quantidade"
              className="flex size-6 items-center justify-center rounded-full text-foreground hover:bg-muted"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="num w-3 text-center text-xs font-semibold">{noCarrinho.qtd}</span>
            <button
              type="button"
              onClick={() => setQty(item.id, noCarrinho.qtd + 1)}
              aria-label="Aumentar quantidade"
              className="flex size-6 items-center justify-center rounded-full text-foreground hover:bg-muted"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => add(item.id, item.nome, item.preco)}
            aria-label="Adicionar"
            className="absolute -bottom-2 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function CardapioClient({
  restauranteId,
  slug,
  nomeRestaurante,
  itensPorCategoria,
}: {
  restauranteId: string;
  slug: string;
  nomeRestaurante?: string;
  itensPorCategoria: Record<string, ItemDoCardapio[]>;
}) {
  const categorias = Object.keys(itensPorCategoria);
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0] ?? "");
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const { total, count } = useCart();

  const pillBarRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
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
  }, [categorias.join("|")]);

  useEffect(() => {
    pillRefs.current[categoriaAtiva]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [categoriaAtiva]);

  function irParaCategoria(cat: string) {
    const el = sectionRefs.current[cat];
    if (!el) return;
    const offset = 56 + (pillBarRef.current?.offsetHeight ?? 0) + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CustomerHeader nomeRestaurante={nomeRestaurante} />

      {categorias.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">O cardápio ainda não tem itens cadastrados.</p>
        </div>
      ) : (
        <>
          <div ref={pillBarRef} className="sticky top-14 z-30 border-b border-border bg-background">
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
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col">
        {count > 0 && (
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
        <CustomerTabBar slug={slug} />
      </div>

      <CartDrawer restauranteId={restauranteId} open={sacolaAberta} onOpenChange={setSacolaAberta} />
    </div>
  );
}
