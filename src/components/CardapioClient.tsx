"use client";

import { ChevronLeft, ChevronRight, Package, Plus, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AvisoFuncionamento from "@/components/AvisoFuncionamento";
import type { Horarios } from "@/lib/horario";
import CartDrawer from "@/components/CartDrawer";
import type { TaxaCartaoOnline, TaxasMaquininha } from "@/lib/taxaMaquininha";
import ItemDetalheDialog from "@/components/ItemDetalheDialog";
import { ItemCard, tintDaCategoria, type ItemDoCardapio } from "@/components/CardapioItemCard";
import CustomerHeader from "@/components/CustomerHeader";
import CustomerTabBar from "@/components/CustomerTabBar";
import RodapeMarca from "@/components/RodapeMarca";
import { fmtBRL } from "@/lib/data";
import { useCart } from "@/lib/cart";

export type { ItemDoCardapio };

export interface ZonaEntregaResumo {
  bairro: string;
  taxaEntrega: number;
  tempoEstimadoMin: number;
}

const NOMES_SURPRESA = ["surpresa"];

function getCombosSurpresa(itensPorCategoria: Record<string, ItemDoCardapio[]>) {
  const todosItens = Object.entries(itensPorCategoria)
    .filter(([cat]) => cat !== "Black Friday")
    .flatMap(([, itens]) => itens);

  return todosItens.filter((item) => NOMES_SURPRESA.some((kw) => item.nome.toLowerCase().includes(kw)));
}

type BannerDaDona = {
  id: string;
  imagemUrl: string;
  linkUrl: string | null;
  titulo: string | null;
  itens: { id: string; nome: string; precoPromocional: number }[];
};

/** Uma promoção pronta pra virar slide: a arte, um título opcional e os itens
 * do cardápio que ela vende (já com o preço promocional). */
type Promocao = {
  key: string;
  imagemUrl: string;
  titulo: string | null;
  opcoes: { id: string; nome: string; preco: number; item: ItemDoCardapio }[];
};

/* A arte do banner não tem proporção garantida: a dona pode subir um banner
 * largo (768x240, o formato que ela usa hoje) ou o cartaz quadrado que ela fez
 * no celular. Então a moldura se adapta à arte em vez de cortá-la: o carrossel
 * mede as artes e escolhe uma proporção única pra todos os slides, limitada
 * entre um cartaz em pé (4:5) e um banner largo (768:240). */
const RATIO_MIN = 4 / 5;
const RATIO_MAX = 768 / 240;
const RATIO_PADRAO = RATIO_MAX;

/** Arte que cabe inteira na moldura: quando a proporção bate com a da moldura
 * ela preenche tudo (`cover`, sem tarja); quando é bem diferente, aparece
 * inteira sobre uma cópia desfocada dela mesma, sem cortar nem esticar. */
function ArteDoBanner({
  imagemUrl,
  alt,
  frameRatio,
  retrato,
  onRatio,
}: {
  imagemUrl: string;
  alt: string;
  frameRatio: number;
  /** Arte em pé: no desktop ela vira a coluna da esquerda do card. */
  retrato: boolean;
  onRatio: (ratio: number) => void;
}) {
  const [ratio, setRatio] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  /* Só preenche a moldura quando a arte praticamente já tem a proporção dela:
   * acima disso o `cover` come um pedaço visível do cartaz, e aí é melhor
   * mostrar a arte inteira sobre o fundo desfocado. */
  const preenche = ratio == null || Math.abs(ratio - frameRatio) / frameRatio < 0.03;

  function medir(img: HTMLImageElement | null) {
    if (!img?.naturalWidth || !img.naturalHeight) return;
    const r = img.naturalWidth / img.naturalHeight;
    setRatio(r);
    onRatio(r);
  }

  /* A arte vem no HTML do servidor e costuma estar pronta antes do React
   * hidratar — aí o `onLoad` nunca dispara e a moldura ficaria no padrão. */
  useEffect(() => {
    if (imgRef.current?.complete) medir(imgRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagemUrl]);

  /* No celular a arte ocupa a largura do card e todos os slides dividem a
   * mesma moldura, senão o carrossel pularia de altura a cada troca; o que
   * não encaixa nela aparece inteiro sobre o fundo desfocado.
   *
   * No desktop, com a arte em pé, quem manda é a altura: a largura sai da
   * proporção da própria arte, então cada cartaz preenche a coluna dele sem
   * tarja nenhuma, e a altura continua igual em todos os slides. */
  const medidas = retrato
    ? "w-full [max-height:70vh] [aspect-ratio:var(--r-moldura)] sm:h-[22rem] sm:max-h-none sm:w-auto sm:[aspect-ratio:var(--r-arte)]"
    : "w-full [max-height:70vh] [aspect-ratio:var(--r-moldura)] sm:[max-height:26rem]";

  return (
    <div
      className={`relative overflow-hidden bg-muted ${medidas}`}
      style={{ "--r-moldura": frameRatio, "--r-arte": ratio ?? frameRatio } as React.CSSProperties}
    >
      {!preenche && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagemUrl}
          alt=""
          aria-hidden
          draggable={false}
          className={`absolute inset-0 h-full w-full scale-110 object-cover blur-xl brightness-[.65] saturate-150 ${
            retrato ? "sm:hidden" : ""
          }`}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imagemUrl}
        alt={alt}
        draggable={false}
        onLoad={(e) => medir(e.currentTarget)}
        className={`absolute inset-0 h-full w-full ${preenche ? "object-cover" : "object-contain"} ${
          retrato ? "sm:object-cover" : ""
        }`}
      />
    </div>
  );
}

/** Os itens da promoção, um por linha. Em pé e não deitado: a fila que rolava
 * na horizontal cortava o último item no celular, e ninguém adivinha que
 * precisa arrastar pro lado pra ver o resto. */
function ItensDaPromocao({
  opcoes,
  onEscolher,
}: {
  opcoes: Promocao["opcoes"];
  onEscolher: (opcao: Promocao["opcoes"][number]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {opcoes.map((opcao) => (
        <button
          key={opcao.id}
          type="button"
          onClick={() => onEscolher(opcao)}
          draggable={false}
          className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/60 active:bg-muted"
        >
          <span className="min-w-0 flex-1 text-[13px] font-semibold leading-tight">
            {/* "Black Friday · Poke" vira só "Poke" */}
            {opcao.nome.includes(" · ") ? opcao.nome.split(" · ").slice(1).join(" · ") : opcao.nome}
          </span>
          <span className="num shrink-0 text-sm font-bold text-primary">{fmtBRL(opcao.preco)}</span>
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Plus className="size-3.5 stroke-[3]" />
          </span>
        </button>
      ))}
    </div>
  );
}

/** Um slide do carrossel: a arte da promoção e os itens que ela vende.
 *
 * São dois arranjos de verdade, não um só espremido: empilhado (celular, e
 * sempre que a arte é larga) e em duas colunas (desktop com arte em pé), onde
 * a arte não preenche um card largo sozinha. */
function BannerCard({
  promo,
  frameRatio,
  onRatio,
  onAbrirItem,
}: {
  promo: Promocao;
  frameRatio: number;
  onRatio: (ratio: number) => void;
  onAbrirItem: (item: ItemDoCardapio) => void;
}) {
  const { opcoes, titulo } = promo;
  const unica = opcoes.length === 1 ? opcoes[0] : null;
  /* Cartaz em pé num card largo deixava um vazio enorme ao lado da arte. No
   * desktop ele vira coluna, o card encolhe pro tamanho do conteúdo e os
   * itens ocupam a coluna de dentro. */
  const retrato = frameRatio < 1.2;

  function abrir(opcao: Promocao["opcoes"][number]) {
    onAbrirItem({ ...opcao.item, preco: opcao.preco, imagemUrl: opcao.item.imagemUrl ?? promo.imagemUrl });
  }

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${
        retrato ? "sm:mx-auto sm:w-fit sm:max-w-full sm:flex-row" : ""
      }`}
    >
      <div
        className={`relative ${retrato ? "sm:shrink-0" : ""} ${unica ? "cursor-pointer" : ""}`}
        onClick={unica ? () => abrir(unica) : undefined}
      >
        <ArteDoBanner
          imagemUrl={promo.imagemUrl}
          alt={titulo ?? "Promoção"}
          frameRatio={frameRatio}
          retrato={retrato}
          onRatio={onRatio}
        />
        {titulo && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
            {titulo}
          </span>
        )}
      </div>

      {opcoes.length === 0 ? null : (
        <>
          {/* Empilhado: a faixa embaixo da arte. */}
          <div className={`flex flex-1 flex-col ${retrato ? "sm:hidden" : ""}`}>
            {unica ? (
              <button
                type="button"
                onClick={() => abrir(unica)}
                className="flex min-h-[4.5rem] flex-1 items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 active:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{unica.nome}</p>
                  <p className="num text-xs text-muted-foreground">{fmtBRL(unica.preco)} na promoção</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm">
                  <Plus className="size-3.5 stroke-[3]" />
                  Pedir
                </span>
              </button>
            ) : (
              <div className="flex-1 p-3">
                <ItensDaPromocao opcoes={opcoes} onEscolher={abrir} />
              </div>
            )}
          </div>

          {/* Duas colunas: o painel ao lado da arte, no desktop. */}
          {retrato && (
            <div className="hidden w-80 min-w-0 flex-col justify-center gap-4 p-6 sm:flex">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {titulo ?? "Promoção"}
              </p>

              {unica ? (
                <>
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold leading-snug">{unica.nome}</h2>
                    {unica.item.descricao && (
                      <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                        {unica.item.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="num text-2xl font-black text-primary">{fmtBRL(unica.preco)}</span>
                    <span className="text-xs text-muted-foreground">na promoção</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrir(unica)}
                    className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:brightness-110"
                  >
                    <Plus className="size-4 stroke-[3]" />
                    Pedir
                  </button>
                </>
              ) : (
                <ItensDaPromocao opcoes={opcoes} onEscolher={abrir} />
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

/** Monta as promoções a mostrar: as que a dona cadastrou e, se não houver
 * nenhuma, o combo surpresa fixo como vitrine de reserva. */
function getPromocoes(
  bannersDona: BannerDaDona[],
  itensPorCategoria: Record<string, ItemDoCardapio[]>,
): Promocao[] {
  const todosItens = Object.values(itensPorCategoria).flat();

  if (bannersDona.length > 0) {
    return bannersDona.map((b) => ({
      key: b.id,
      imagemUrl: b.imagemUrl,
      titulo: b.titulo,
      opcoes: b.itens.flatMap((bi) => {
        const item = todosItens.find((i) => i.nome === bi.nome);
        return item ? [{ id: bi.id, nome: bi.nome, preco: bi.precoPromocional, item }] : [];
      }),
    }));
  }

  const combos = getCombosSurpresa(itensPorCategoria);
  if (combos.length === 0) return [];
  return [
    {
      key: "surpresa",
      imagemUrl: "/banner-combo-surpresa.png",
      titulo: "Combo surpresa",
      opcoes: combos.map((item) => ({
        id: item.id,
        nome: item.nome.replace(/combo surpresa/i, "").trim() || item.nome,
        preco: item.preco,
        item,
      })),
    },
  ];
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
  const [pausado, setPausado] = useState(false);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const promocoes = getPromocoes(bannersDona, itensPorCategoria);
  const total = promocoes.length;

  /* Uma moldura só pra todos os slides (senão o carrossel pula de altura a
   * cada troca), pela mediana das artes já medidas. */
  const medidas = Object.values(ratios).sort((a, b) => a - b);
  const frameRatio = medidas.length === 0
    ? RATIO_PADRAO
    : Math.min(RATIO_MAX, Math.max(RATIO_MIN, medidas[Math.floor(medidas.length / 2)]));

  function registrarRatio(key: string, ratio: number) {
    setRatios((atual) => (atual[key] === ratio ? atual : { ...atual, [key]: ratio }));
  }

  function goTo(idx: number) {
    if (total === 0) return;
    setSlide(((idx % total) + total) % total);
    setDragOffset(0);
  }

  function onDragStart(x: number) {
    isDraggingRef.current = true;
    startXRef.current = x;
    setDragOffset(0);
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

  /* Passa sozinho, mas para enquanto a pessoa está olhando de perto (mouse em
   * cima, arrastando) ou se o sistema pede menos animação. */
  useEffect(() => {
    if (total <= 1 || pausado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % total), 5500);
    return () => clearInterval(id);
  }, [total, pausado, slide]);

  if (total === 0) return null;

  const arrastando = dragOffset !== 0;

  return (
    <>
      <div
        className="relative mx-auto w-full max-w-2xl px-4 pt-4 md:px-6"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
      >
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="flex select-none items-stretch"
            style={{
              transform: `translateX(calc(-${slide * 100}% + ${dragOffset}px))`,
              transition: arrastando ? "none" : "transform .45s cubic-bezier(.4,0,.2,1)",
              cursor: total > 1 ? (arrastando ? "grabbing" : "grab") : undefined,
            }}
            onTouchStart={(e) => { setPausado(true); onDragStart(e.touches[0].clientX); }}
            onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
            onTouchEnd={(e) => { onDragEnd(e.changedTouches[0].clientX); setPausado(false); }}
            onMouseDown={(e) => { if (total > 1) { e.preventDefault(); onDragStart(e.clientX); } }}
          >
            {promocoes.map((promo, i) => (
              <div
                key={promo.key}
                className="w-full shrink-0"
                aria-hidden={i !== slide}
                style={{ pointerEvents: arrastando || i !== slide ? "none" : "auto" }}
              >
                <BannerCard
                  promo={promo}
                  frameRatio={frameRatio}
                  onRatio={(r) => registrarRatio(promo.key, r)}
                  onAbrirItem={setItemAberto}
                />
              </div>
            ))}
          </div>

        </div>

        {/* Controles embaixo do card: sobre a arte as bolinhas brigavam com o
         * preço, e no desktop a seta da direita caía em cima dos itens. */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2.5">
            <button
              type="button"
              onClick={() => goTo(slide - 1)}
              aria-label="Promoção anterior"
              className="hidden size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
            >
              <ChevronLeft className="size-5" />
            </button>

            <div className="flex items-center gap-1.5">
              {promocoes.map((promo, i) => (
                <button
                  key={promo.key}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Ir para a promoção ${i + 1} de ${total}`}
                  aria-current={slide === i}
                  className={`h-1.5 rounded-full transition-all ${slide === i ? "bg-primary" : "bg-border"}`}
                  style={{ width: slide === i ? 20 : 6 }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(slide + 1)}
              aria-label="Próxima promoção"
              className="hidden size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
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
            <div className="mx-auto w-full max-w-2xl flex-1 px-4 md:px-6 pb-2">
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
            <div className="mx-auto w-full max-w-2xl flex-1 px-4 md:px-6 pb-2">
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

      <RodapeMarca />

      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col pointer-events-none">
        {count > 0 && (
          <div className="px-4 pb-3 pointer-events-auto">
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
        <div className="pointer-events-auto">
          <CustomerTabBar slug={slug} />
        </div>
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
