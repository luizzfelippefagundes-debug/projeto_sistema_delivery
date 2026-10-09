"use client";

import { Package, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import ItemDetalheDialog from "@/components/ItemDetalheDialog";
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

const NOMES_SURPRESA = ["surpresa"];

const PRECO_ORIGINAL_KIDS: Record<string, number> = {
  "15": 67.50,
  "30": 122.50,
  "50": 225.50,
};

function BannerSurpresa({
  itensPorCategoria,
  onAbrirItem,
}: {
  itensPorCategoria: Record<string, ItemDoCardapio[]>;
  onAbrirItem: (item: ItemDoCardapio) => void;
}) {
  const todosItens = Object.values(itensPorCategoria).flat();
  const combos = todosItens.filter((item) =>
    NOMES_SURPRESA.some((kw) => item.nome.toLowerCase().includes(kw)),
  );
  if (combos.length === 0) return null;
  return (
    <div className="overflow-hidden bg-zinc-900">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/banner-combo-surpresa.png" alt="Promo Combo Surpresa" className="h-48 w-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-zinc-900/20 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-red-400">Promoção especial</p>
          <h2 className="font-heading text-2xl font-black leading-none text-white">COMBO SURPRESA</h2>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-px bg-zinc-700 p-px">
        {combos.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onAbrirItem({ ...item, imagemUrl: item.imagemUrl ?? "/banner-combo-surpresa.png" })}
            className="flex flex-col items-center gap-1 bg-zinc-900 px-2 py-3 text-center transition-colors hover:bg-zinc-800 active:bg-zinc-700"
          >
            <span className="text-[10px] font-bold leading-tight text-red-400">
              {item.nome.replace(/combo surpresa/i, "").trim() || item.nome}
            </span>
            <span className="num text-sm font-black text-white">{fmtBRL(item.preco)}</span>
            <span className="mt-0.5 rounded bg-red-700 px-2 py-0.5 text-[10px] font-semibold text-white">Pedir</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BannerKids({
  itensPorCategoria,
  onAbrirItem,
}: {
  itensPorCategoria: Record<string, ItemDoCardapio[]>;
  onAbrirItem: (item: ItemDoCardapio) => void;
}) {
  const itensKids = (itensPorCategoria["Especial Kids"] ?? []);
  if (itensKids.length === 0) return null;

  const tamanhos = ["15", "30", "50"];

  function itemPorTipo(tam: string, tipo: "HOT" | "CRU") {
    return itensKids.find((i) => i.nome.includes(tam) && i.nome.toUpperCase().includes(tipo)) ?? null;
  }

  return (
    <div className="overflow-hidden" style={{ background: "#f5f0e8" }}>
      <div className="px-4 py-3" style={{ borderBottom: "2px solid #e8dfc8" }}>
        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#9ca3af", marginBottom: 4 }}>Especial Kids</p>
        <div className="flex gap-1.5 font-heading text-2xl font-black leading-none">
          <span style={{ color: "#16a34a" }}>DIAS</span>
          <span style={{ color: "#d97706" }}>DAS</span>
          <span style={{ color: "#2563eb" }}>CRIANÇAS</span>
        </div>
      </div>
      {(["HOT", "CRU"] as const).map((tipo) => (
        <div key={tipo} style={{ gap: 1, background: "#e8dfc8", padding: "1px", display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr" }}>
          <div className="flex items-center justify-center px-3" style={{ background: "#faf7f0" }}>
            <span className="text-xs font-black uppercase tracking-wide" style={{ color: tipo === "HOT" ? "#dc2626" : "#2563eb", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
              {tipo}
            </span>
          </div>
          {tamanhos.map((tam) => {
            const item = itemPorTipo(tam, tipo);
            const precoOriginal = PRECO_ORIGINAL_KIDS[tam];
            return (
              <button
                key={tam}
                type="button"
                disabled={!item}
                onClick={() => item && onAbrirItem({ ...item, imagemUrl: item.imagemUrl ?? "/banner-kids.png" })}
                className="flex flex-col items-center gap-1 py-3 transition-colors"
                style={{ background: "#faf7f0" }}
              >
                <span className="font-heading text-sm font-black" style={{ color: "#1a1a1a" }}>{tam} peças</span>
                <span className="num text-xs" style={{ color: "#9ca3af", textDecoration: "line-through" }}>
                  {fmtBRL(precoOriginal)}
                </span>
                <span className="num rounded-md px-2 py-1 text-sm font-black" style={{ background: "#fbbf24", color: "#1a1a1a" }}>
                  {item ? fmtBRL(item.preco) : "—"}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function BannerCarousel({ itensPorCategoria }: { itensPorCategoria: Record<string, ItemDoCardapio[]> }) {
  const [itemAberto, setItemAberto] = useState<ItemDoCardapio | null>(null);
  const [slide, setSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const temSurpresa = Object.values(itensPorCategoria).flat().some((i) => i.nome.toLowerCase().includes("surpresa"));
  const temKids = (itensPorCategoria["Especial Kids"] ?? []).length > 0;
  const total = [temSurpresa, temKids].filter(Boolean).length;

  function goTo(idx: number) {
    const next = Math.max(0, Math.min(idx, total - 1));
    setSlide(next);
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide((s) => (s + 1) % total), 4500);
  }

  useEffect(() => {
    if (total <= 1) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  if (total === 0) return null;

  const slides = [
    temSurpresa && <BannerSurpresa key="surpresa" itensPorCategoria={itensPorCategoria} onAbrirItem={setItemAberto} />,
    temKids && <BannerKids key="kids" itensPorCategoria={itensPorCategoria} onAbrirItem={setItemAberto} />,
  ].filter(Boolean);

  return (
    <>
      <div className="mx-auto w-full max-w-2xl pt-4">
        <div className="overflow-hidden rounded-2xl shadow-lg">
          {total === 1 ? (
            slides[0]
          ) : (
            <>
              <div
                ref={trackRef}
                className="flex"
                style={{ transform: `translateX(-${slide * 100}%)`, transition: "transform .4s cubic-bezier(.4,0,.2,1)" }}
                onTouchStart={(e) => { startXRef.current = e.touches[0].clientX; resetTimer(); }}
                onTouchEnd={(e) => {
                  const dx = e.changedTouches[0].clientX - startXRef.current;
                  if (Math.abs(dx) > 40) goTo(slide + (dx < 0 ? 1 : -1));
                }}
              >
                {slides.map((s, i) => (
                  <div key={i} className="w-full shrink-0">
                    {s}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-1.5 bg-zinc-900 pb-2 pt-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { goTo(i); resetTimer(); }}
                    aria-label={`Slide ${i + 1}`}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: slide === i ? 18 : 6,
                      background: slide === i ? "#fff" : "rgba(255,255,255,.3)",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <ItemDetalheDialog
        item={itemAberto}
        tint="bg-status-danger-bg text-status-danger-fg"
        icon={Package}
        open={itemAberto !== null}
        onOpenChange={(v) => { if (!v) setItemAberto(null); }}
      />
    </>
  );
}

export default function CardapioClient({
  restauranteId,
  slug,
  nomeRestaurante,
  itensPorCategoria,
  zonasEntrega,
  enderecoLoja,
  souDona = false,
}: {
  restauranteId: string;
  slug: string;
  nomeRestaurante?: string;
  itensPorCategoria: Record<string, ItemDoCardapio[]>;
  zonasEntrega: ZonaEntregaResumo[];
  enderecoLoja: string | null;
  /** A própria dona olhando o cardápio como cliente veria — mostra o menu
   * de trocar de painel no cabeçalho. */
  souDona?: boolean;
}) {
  const categorias = Object.keys(itensPorCategoria);
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0] ?? "");
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const { total, count } = useCart();

  const termoBusca = busca.trim().toLowerCase();
  const todosItens = Object.values(itensPorCategoria).flat();
  const resultadosBusca = termoBusca
    ? todosItens.filter(
        (item) =>
          item.nome.toLowerCase().includes(termoBusca) ||
          item.descricao?.toLowerCase().includes(termoBusca),
      )
    : [];

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
      <CustomerHeader nomeRestaurante={nomeRestaurante} slug={slug} souDona={souDona} />

      <BannerCarousel itensPorCategoria={itensPorCategoria} />

      {categorias.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">O cardápio ainda não tem itens cadastrados.</p>
        </div>
      ) : (
        <>
          <div ref={pillBarRef} className="sticky top-14 z-30 border-b border-border bg-background">
            <div className="mx-auto max-w-2xl px-4 pt-2 md:px-6">
              <div className="relative flex items-center">
                <Search className="absolute left-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar no cardápio..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    className="absolute right-3 text-muted-foreground hover:text-foreground"
                    aria-label="Limpar busca"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {!termoBusca && (
              <div className="mx-auto flex max-w-2xl gap-5 overflow-x-auto px-4 md:px-6">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    ref={(el) => { pillRefs.current[cat] = el; }}
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
            )}
          </div>

          {termoBusca ? (
            <div className={`mx-auto w-full max-w-2xl flex-1 px-4 md:px-6 ${count ? "pb-40" : "pb-24"}`}>
              {resultadosBusca.length === 0 ? (
                <p className="pt-10 text-center text-sm text-muted-foreground">Nenhum item encontrado para "{busca}".</p>
              ) : (
                <div className="flex flex-col">
                  <p className="pt-4 text-xs text-muted-foreground">{resultadosBusca.length} resultado{resultadosBusca.length !== 1 ? "s" : ""}</p>
                  {resultadosBusca.map((item) => {
                    const cat = Object.entries(itensPorCategoria).find(([, lista]) => lista.some((i) => i.id === item.id))?.[0] ?? categorias[0];
                    return <ItemCard key={item.id} item={item} categoria={cat} tint={tintDaCategoria(cat, categorias)} />;
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className={`mx-auto w-full max-w-2xl flex-1 px-4 md:px-6 ${count ? "pb-40" : "pb-24"}`}>
              {categorias.map((cat) => (
                <div
                  key={cat}
                  ref={(el) => { sectionRefs.current[cat] = el; }}
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
          )}
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
