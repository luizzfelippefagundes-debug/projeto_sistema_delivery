"use client";

import { useEffect, useRef, useState } from "react";

interface BannerItem {
  id: string;
  nome: string;
  precoPromocional: number;
}

interface Banner {
  id: string;
  imagemUrl: string;
  linkUrl: string | null;
  titulo: string | null;
  itens: BannerItem[];
}

function formatPreco(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function BannersCarousel({ banners }: { banners: Banner[] }) {
  const [atual, setAtual] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function avancar(idx: number) {
    setAtual((idx + banners.length) % banners.length);
  }

  useEffect(() => {
    if (banners.length <= 1) return;
    timer.current = setInterval(() => setAtual((p) => (p + 1) % banners.length), 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[atual];
  const temOverlay = !!banner.titulo || banner.itens.length > 0;

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    banner.linkUrl ? (
      <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
        {children}
      </a>
    ) : (
      <div>{children}</div>
    );

  return (
    <div className="mx-auto w-full max-w-2xl pt-4">
      <div className="relative overflow-hidden rounded-2xl bg-muted shadow-lg">
        <Wrapper>
          {/* Arte no formato original (a dona sobe quadrado, retrato ou paisagem); só limita a altura. */}
          <div className="relative mx-auto w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.imagemUrl}
              alt={banner.titulo ?? ""}
              className="block h-auto max-h-[480px] w-auto max-w-full"
            />
            {temOverlay && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                {banner.titulo && (
                  <p className="text-white font-semibold text-sm leading-tight">{banner.titulo}</p>
                )}
                {banner.itens.length > 0 && (
                  <p className="text-white/90 text-xs mt-0.5">
                    {banner.itens.map((i) => `${i.nome} ${formatPreco(i.precoPromocional)}`).join(" + ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </Wrapper>

        {banners.length > 1 && (
          <>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => avancar(i)}
                  aria-label={`Ir para banner ${i + 1}`}
                  className={`size-1.5 rounded-full transition-all ${i === atual ? "w-4 bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => avancar(atual - 1)}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => avancar(atual + 1)}
              aria-label="Próximo"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
