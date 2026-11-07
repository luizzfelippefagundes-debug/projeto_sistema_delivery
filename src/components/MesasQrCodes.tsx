"use client";

import { Download, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";

export interface QrDeMesa {
  mesa: number;
  dataUrl: string;
  url: string;
}

/* Dimensões do design original — Display acrílico A6 (10,5×14,8 cm) */
const W = 420;
const H = 592;

export default function MesasQrCodes({ qrs }: { qrs: QrDeMesa[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-muted-foreground">
          Imprime e coloca um em cada mesa — o cliente escaneia e pede direto pela cozinha.
        </p>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer /> Imprimir todos
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-2 print:gap-6">
        {qrs.map((qr) => (
          <CartaoQrMesa key={qr.mesa} qr={qr} />
        ))}
      </div>
    </div>
  );
}

function CartaoQrMesa({ qr }: { qr: QrDeMesa }) {
  const mesaStr = String(qr.mesa).padStart(2, "0");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  /* ajusta a escala toda vez que a coluna muda de tamanho */
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / W);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  async function baixarImagem() {
    if (!captureRef.current) return;
    const url = await toPng(captureRef.current, { pixelRatio: 3, cacheBust: true });
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashi-mesa-${mesaStr}.png`;
    a.click();
  }

  return (
    <div className="flex flex-col items-center gap-3 break-inside-avoid">
      {/*
        wrapper define o espaço real na página (proporcional a 420×592).
        o card interno fica em 420×592 fixos e é reduzido via transform.
      */}
      <div
        ref={wrapperRef}
        style={{ width: "100%", aspectRatio: `${W} / ${H}`, position: "relative", overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <CardDesign ref={captureRef} qrDataUrl={qr.dataUrl} mesaStr={mesaStr} />
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="print:hidden w-full"
        onClick={baixarImagem}
      >
        <Download /> Baixar Mesa {mesaStr}
      </Button>
    </div>
  );
}

import { forwardRef } from "react";

const CardDesign = forwardRef<HTMLDivElement, { qrDataUrl: string; mesaStr: string }>(
  function CardDesign({ qrDataUrl, mesaStr }, ref) {
    return (
      <div
        ref={ref}
        style={{
          width: W,
          height: H,
          boxSizing: "border-box",
          background: "#111111",
          color: "#F4EFE6",
          fontFamily: "'DM Sans', var(--font-body, sans-serif)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 36px 36px",
          gap: 14,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* círculo decorativo vermelho */}
        <div
          style={{
            position: "absolute",
            top: -70,
            right: -70,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "#C8102E",
          }}
        />

        {/* logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            position: "relative",
          }}
        >
          <span style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: "#BDB5A8" }}>
            Bem-vindo ao
          </span>
          <span
            style={{
              fontFamily: "'Shippori Mincho', var(--font-mincho, serif)",
              fontWeight: 800,
              fontSize: 52,
              lineHeight: 1,
              letterSpacing: 2,
            }}
          >
            Dashi
          </span>
          <span style={{ fontSize: 12, letterSpacing: 8, textTransform: "uppercase", color: "#C8102E", fontWeight: 700 }}>
            Sushi
          </span>
        </div>

        {/* subtítulo */}
        <div
          style={{
            fontFamily: "'Shippori Mincho', var(--font-mincho, serif)",
            fontWeight: 600,
            fontSize: 22,
            textAlign: "center",
            lineHeight: 1.25,
            marginTop: 6,
          }}
        >
          Escaneie e faça<br />seu pedido
        </div>

        {/* container QR */}
        <div
          style={{
            backgroundColor: "#F4EFE6",
            borderRadius: 18,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR code Mesa ${mesaStr}`}
            width={190}
            height={190}
            style={{ display: "block", borderRadius: 6 }}
          />
          <div
            style={{
              backgroundColor: "#111111",
              color: "#F4EFE6",
              borderRadius: 999,
              padding: "6px 16px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            MESA {mesaStr}
          </div>
        </div>

        {/* passos */}
        <div style={{ display: "flex", gap: 18, fontSize: 12, color: "#BDB5A8", marginTop: 4 }}>
          {(
            [
              ["1", "Aponte a câmera"],
              ["2", "Escolha os pratos"],
              ["3", "Pedido vai à cozinha"],
            ] as const
          ).map(([n, label]) => (
            <div
              key={n}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center" }}
            >
              <b style={{ color: "#F4EFE6", fontSize: 16 }}>{n}</b>
              {label}
            </div>
          ))}
        </div>

        {/* rodapé */}
        <div style={{ marginTop: "auto", fontSize: 11, color: "#8F887D" }}>
          Wi-Fi: Dashi Sushi · Peça a senha no balcão
        </div>
      </div>
    );
  }
);
