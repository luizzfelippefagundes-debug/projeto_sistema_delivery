"use client";

import { useEffect, useRef, useState } from "react";

interface Banner {
  id: string;
  imagemUrl: string;
  linkUrl: string | null;
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

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    banner.linkUrl ? (
      <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
        {children}
      </a>
    ) : (
      <div>{children}</div>
    );

  return (
    <div className="relative w-full overflow-hidden">
      <Wrapper>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.imagemUrl}
          alt=""
          className="aspect-[16/5] w-full object-cover"
        />
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
  );
}
