"use client";

import { ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import { ItemCard, tintDaCategoria, type ItemDoCardapio } from "@/components/CardapioItemCard";
import CustomerHeader from "@/components/CustomerHeader";
import CustomerTabBar from "@/components/CustomerTabBar";
import { fmtBRL } from "@/lib/data";
import { useCart } from "@/lib/cart";

export type { ItemDoCardapio };

export interface ZonaEntregaResumo {
  bairro: string;
  taxaEntrega: number;
  tempoEstimadoMin: number;
}

export default function CardapioClient({
  restauranteId,
  slug,
  nomeRestaurante,
  itensPorCategoria,
  zonasEntrega,
  enderecoLoja,
}: {
  restauranteId: string;
  slug: string;
  nomeRestaurante?: string;
  itensPorCategoria: Record<string, ItemDoCardapio[]>;
  zonasEntrega: ZonaEntregaResumo[];
  enderecoLoja: string | null;
}) {
  const categorias = Object.keys(itensPorCategoria);
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0] ?? "");
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const { total, count } = useCart();

  const itensPorId: Record<string, ItemDoCardapio> = {};
  for (const lista of Object.values(itensPorCategoria)) {
    for (const item of lista) itensPorId[item.id] = item;
  }

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

      <CartDrawer
        restauranteId={restauranteId}
        zonasEntrega={zonasEntrega}
        enderecoLoja={enderecoLoja}
        itensPorId={itensPorId}
        open={sacolaAberta}
        onOpenChange={setSacolaAberta}
      />
    </div>
  );
}
