"use client";

import { Package, Plus, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AvisoFuncionamento from "@/components/AvisoFuncionamento";
import type { Horarios } from "@/lib/horario";
import CartDrawer from "@/components/CartDrawer";
import type { TaxaCartaoOnline, TaxasMaquininha } from "@/lib/taxaMaquininha";
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

type BannerDaDona = {
  id: string;
  imagemUrl: string;
  linkUrl: string | null;
  titulo: string | null;
  itens: { id: string; nome: string; precoPromocional: number }[];
};

/** Banner que a dona sobe pelo painel, no mesmo formato dos fixos: a arte em
 * cima e um "Pedir" por item ligado ao banner, que abre o item do cardápio
 * com o mesmo nome. */
function BannerDona({
  banner,
  itensPorCategoria,
  onAbrirItem,
}: {
  banner: BannerDaDona;
  itensPorCategoria: Record<string, ItemDoCardapio[]>;
  onAbrirItem: (item: ItemDoCardapio) => void;
}) {
  const todosItens = Object.values(itensPorCategoria).flat();
  const opcoes = banner.itens
    .map((b) => ({ banner: b, item: todosItens.find((i) => i.nome === b.nome) }))
    .filter((o): o is { banner: BannerDaDona["itens"][number]; item: ItemDoCardapio } => o.item != null);

  return (
    <div className="overflow-hidden bg-zinc-900">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner.imagemUrl} alt={banner.titulo ?? ""} className="h-56 w-full object-cover" />
        {banner.titulo && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-zinc-900/20 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-red-400">Promoção especial</p>
              <h2 className="font-heading text-2xl font-black leading-none text-white">{banner.titulo}</h2>
            </div>
          </>
        )}
      </div>
      {opcoes.length > 0 && (
        <div
          className="grid gap-px bg-zinc-700 p-px"
          style={{ gridTemplateColumns: `repeat(${Math.min(opcoes.length, 3)}, minmax(0, 1fr))` }}
        >
          {opcoes.map(({ banner: b, item }) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onAbrirItem({ ...item, imagemUrl: item.imagemUrl ?? banner.imagemUrl })}
              className="flex flex-col items-center gap-1 bg-zinc-900 px-2 py-3 text-center transition-colors hover:bg-zinc-800 active:bg-zinc-700"
            >
              <span className="text-[10px] font-bold leading-tight text-red-400">
                {b.nome.includes(" · ") ? b.nome.split(" · ").slice(1).join(" · ") : b.nome}
              </span>
              <span className="num text-sm font-black text-white">{fmtBRL(b.precoPromocional)}</span>
              <span className="mt-0.5 rounded bg-red-700 px-2 py-0.5 text-[10px] font-semibold text-white">Pedir</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BannerCarousel({
  itensPorCategoria,
  bannersDona,
}: {
  itensPorCategoria: Record<string, ItemDoCardapio[]>;
  bannersDona: BannerDaDona[];
}) {
  const [itemAberto, setItemAberto] = useState<ItemDoCardapio | null>(null);
  const [slide, setSlide] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const temSurpresa = Object.values(itensPorCategoria).flat().some((i) => i.nome.toLowerCase().includes("surpresa"));
  const temKids = (itensPorCategoria["Especial Kids"] ?? []).length > 0;
  const total = bannersDona.length + [temSurpresa, temKids].filter(Boolean).length;

  function goTo(idx: number) {
    const next = Math.max(0, Math.min(idx, total - 1));
    setSlide(next);
    setDragOffset(0);
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide((s) => (s + 1) % total), 4500);
  }

  function onDragStart(x: number) {
    isDraggingRef.current = true;
    startXRef.current = x;
    setDragOffset(0);
    resetTimer();
  }

  function onDragMove(x: number) {
    if (!isDraggingRef.current) return;
    setDragOffset(x - startXRef.current);
  }

  function onDragEnd(x: number) {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const dx = x - startXRef.current;
    setDragOffset(0);
    if (Math.abs(dx) > 40) goTo(slide + (dx < 0 ? 1 : -1));
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) { onDragMove(e.clientX); }
    function onMouseUp(e: MouseEvent) { onDragEnd(e.clientX); }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide]);

  useEffect(() => {
    if (total <= 1) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  if (total === 0) return null;

  const slides = [
    ...bannersDona.map((b) => (
      <BannerDona key={b.id} banner={b} itensPorCategoria={itensPorCategoria} onAbrirItem={setItemAberto} />
    )),
    temSurpresa && <BannerSurpresa key="surpresa" itensPorCategoria={itensPorCategoria} onAbrirItem={setItemAberto} />,
    temKids && <BannerKids key="kids" itensPorCategoria={itensPorCategoria} onAbrirItem={setItemAberto} />,
  ].filter(Boolean);

  const isDragging = dragOffset !== 0;

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
                className="flex select-none"
                style={{
                  transform: `translateX(calc(-${slide * 100}% + ${dragOffset}px))`,
                  transition: isDragging ? "none" : "transform .4s cubic-bezier(.4,0,.2,1)",
                  cursor: isDragging ? "grabbing" : "grab",
                }}
                onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
                onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
                onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX); }}
              >
                {slides.map((s, i) => (
                  <div key={i} className="w-full shrink-0 pointer-events-none" style={{ pointerEvents: isDragging ? "none" : "auto" }}>
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

function MaisPedidosCarousel({
  itens,
  onAbrirItem,
}: {
  itens: ItemDoCardapio[];
  onAbrirItem: (item: ItemDoCardapio) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const draggedEnough = useRef(false);

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    draggedEnough.current = false;
    startX.current = e.pageX - (trackRef.current?.offsetLeft ?? 0);
    scrollLeft.current = trackRef.current?.scrollLeft ?? 0;
    if (trackRef.current) trackRef.current.style.cursor = "grabbing";
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const dx = x - startX.current;
    if (Math.abs(dx) > 4) draggedEnough.current = true;
    trackRef.current.scrollLeft = scrollLeft.current - dx;
  }

  function onMouseUp() {
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = "grab";
  }

  if (itens.length === 0) return null;
  return (
    <div className="pt-4 pb-2">
      <div className="mx-auto max-w-2xl">
        <h2 className="px-4 pb-2 font-heading text-base font-extrabold md:px-6">🔥 Mais pedidos</h2>
        <div
          ref={trackRef}
          className="flex select-none gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-6"
          style={{ cursor: "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {itens.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { if (!draggedEnough.current) onAbrirItem(item); }}
              draggable={false}
              className="group flex w-28 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              <div className="relative h-24 w-full bg-muted">
                {item.imagemUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imagemUrl} alt={item.nome} draggable={false} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🍣</div>
                )}
                <span className="absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Plus className="size-3.5 stroke-[3]" />
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 p-2">
                <p className="line-clamp-2 text-left text-[11px] font-semibold leading-tight">{item.nome}</p>
                <p className="num mt-auto text-left text-[11px] font-bold text-primary">{fmtBRL(item.preco)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CardapioClient({
  restauranteId,
  slug,
  nomeRestaurante,
  itensPorCategoria,
  zonasEntrega,
  enderecoLoja,
  taxasMaquininha,
  bannersDona = [],
  souDona = false,
  pagamentoOnline = false,
  soPixOnline = false,
  taxaCartaoOnline = null,
  horarios = null,
  maisPedidos = [],
}: {
  restauranteId: string;
  slug: string;
  nomeRestaurante?: string;
  itensPorCategoria: Record<string, ItemDoCardapio[]>;
  zonasEntrega: ZonaEntregaResumo[];
  enderecoLoja: string | null;
  taxasMaquininha: TaxasMaquininha;
  bannersDona?: BannerDaDona[];
  /** A própria dona olhando o cardápio como cliente veria — mostra o menu
   * de trocar de painel no cabeçalho. */
  souDona?: boolean;
  pagamentoOnline?: boolean;
  /** Pix direto pelo Inter: só o Pix é online, cartão fica pra entrega. */
  soPixOnline?: boolean;
  taxaCartaoOnline?: TaxaCartaoOnline | null;
  horarios?: Horarios | null;
  maisPedidos?: ItemDoCardapio[];
}) {
  const categorias = Object.keys(itensPorCategoria);
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0] ?? "");
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [itemMaisPedidosAberto, setItemMaisPedidosAberto] = useState<ItemDoCardapio | null>(null);
  const { total, count } = useCart();

  const infoEntrega = (() => {
    if (zonasEntrega.length === 0) return null;
    const tempos = zonasEntrega.map((z) => z.tempoEstimadoMin);
    const taxaMin = Math.min(...zonasEntrega.map((z) => z.taxaEntrega));
    const tMin = Math.min(...tempos);
    const tMax = Math.max(...tempos);
    const tempo = tMin === tMax ? `${tMin} min` : `${tMin}–${tMax} min`;
    return `Entrega ${tempo} · taxa a partir de ${taxaMin === 0 ? "grátis" : fmtBRL(taxaMin)}`;
  })();

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
      <AvisoFuncionamento horarios={horarios} />

      {infoEntrega && (
        <p className="border-b border-border bg-card px-4 py-2 text-center text-xs font-medium text-muted-foreground">
          {infoEntrega}
        </p>
      )}

      <BannerCarousel itensPorCategoria={itensPorCategoria} bannersDona={bannersDona} />

      <MaisPedidosCarousel itens={maisPedidos} onAbrirItem={setItemMaisPedidosAberto} />

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
              <div className="relative mx-auto max-w-2xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />
                <div className="flex gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-6">
                  {categorias.map((cat) => (
                    <button
                      key={cat}
                      ref={(el) => { pillRefs.current[cat] = el; }}
                      type="button"
                      onClick={() => irParaCategoria(cat)}
                      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        categoriaAtiva === cat
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {termoBusca ? (
            <div className={`mx-auto w-full max-w-2xl flex-1 px-4 md:px-6 ${count ? "pb-40" : "pb-24"}`}>
              {resultadosBusca.length === 0 ? (
                <p className="pt-10 text-center text-sm text-muted-foreground">Nenhum item encontrado para &quot;{busca}&quot;.</p>
              ) : (
                <div className="flex flex-col">
                  <p className="pt-4 pb-3 text-xs text-muted-foreground">{resultadosBusca.length} resultado{resultadosBusca.length !== 1 ? "s" : ""}</p>
                  <div className="flex flex-col gap-3">
                    {resultadosBusca.map((item) => {
                      const cat = Object.entries(itensPorCategoria).find(([, lista]) => lista.some((i) => i.id === item.id))?.[0] ?? categorias[0];
                      return <ItemCard key={item.id} item={item} categoria={cat} tint={tintDaCategoria(cat, categorias)} />;
                    })}
                  </div>
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
                  <h2 className="pt-5 pb-3 font-heading text-lg font-extrabold">{cat}</h2>
                  <div className="flex flex-col gap-3">
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
          <div className="px-4 pb-3">
            <button
              type="button"
              onClick={() => setSacolaAberta(true)}
              className="mx-auto flex w-full max-w-sm items-center justify-between rounded-full bg-foreground py-2 pr-2 pl-5 text-background shadow-xl transition-transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2 text-sm font-bold">
                <ShoppingBag className="size-4" />
                {count} {count === 1 ? "item" : "itens"} · <span className="num">{fmtBRL(total)}</span>
              </span>
              <span className="rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground">Ver sacola</span>
            </button>
          </div>
        )}
        <CustomerTabBar slug={slug} />
      </div>

      <CartDrawer
        restauranteId={restauranteId}
        zonasEntrega={zonasEntrega}
        enderecoLoja={enderecoLoja}
        taxasMaquininha={taxasMaquininha}
        itensPorId={itensPorId}
        open={sacolaAberta}
        onOpenChange={setSacolaAberta}
        pagamentoOnline={pagamentoOnline}
        soPixOnline={soPixOnline}
        horarios={horarios}
        taxaCartaoOnline={taxaCartaoOnline}
      />

      <ItemDetalheDialog
        item={itemMaisPedidosAberto}
        tint="bg-status-danger-bg text-status-danger-fg"
        icon={Package}
        open={itemMaisPedidosAberto !== null}
        onOpenChange={(v) => { if (!v) setItemMaisPedidosAberto(null); }}
      />
    </div>
  );
}
