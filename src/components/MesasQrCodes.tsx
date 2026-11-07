"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QrDeMesa {
  mesa: number;
  dataUrl: string;
  url: string;
}

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

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-2 print:gap-6">
        {qrs.map((qr) => (
          <CartaoQrMesa key={qr.mesa} qr={qr} />
        ))}
      </div>
    </div>
  );
}

function CartaoQrMesa({ qr }: { qr: QrDeMesa }) {
  const mesaStr = String(qr.mesa).padStart(2, "0");

  return (
    <div
      className="break-inside-avoid"
      style={{
        width: "100%",
        maxWidth: 420,
        aspectRatio: "420 / 592",
        margin: "0 auto",
        backgroundColor: "#111111",
        color: "#F4EFE6",
        fontFamily: "var(--font-body, sans-serif)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 36px 36px",
        gap: 14,
        position: "relative",
        overflow: "hidden",
        borderRadius: 12,
      }}
    >
      {/* círculo decorativo vermelho no canto superior direito */}
      <div
        style={{
          position: "absolute",
          top: -70,
          right: -70,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "#C8102E",
          pointerEvents: "none",
        }}
      />

      {/* cabeçalho — logo textual */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#BDB5A8",
          }}
        >
          Bem-vindo ao
        </span>
        <span
          style={{
            fontFamily: "var(--font-mincho, serif)",
            fontWeight: 800,
            fontSize: 52,
            lineHeight: 1,
            letterSpacing: 2,
          }}
        >
          Dashi
        </span>
        <span
          style={{
            fontSize: 12,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#C8102E",
            fontWeight: 700,
          }}
        >
          Sushi
        </span>
      </div>

      {/* subtítulo */}
      <div
        style={{
          fontFamily: "var(--font-mincho, serif)",
          fontWeight: 600,
          fontSize: 22,
          textAlign: "center",
          lineHeight: 1.25,
          marginTop: 6,
        }}
      >
        Escaneie e faça<br />seu pedido
      </div>

      {/* container claro com QR + badge da mesa */}
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
          src={qr.dataUrl}
          alt={`QR code da Mesa ${qr.mesa}`}
          style={{ width: 190, height: 190, display: "block", borderRadius: 6 }}
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
      <div
        style={{
          display: "flex",
          gap: 18,
          fontSize: 12,
          color: "#BDB5A8",
          marginTop: 4,
        }}
      >
        {[
          { n: "1", label: "Aponte a câmera" },
          { n: "2", label: "Escolha os pratos" },
          { n: "3", label: "Pedido vai à cozinha" },
        ].map(({ n, label }) => (
          <div
            key={n}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              textAlign: "center",
            }}
          >
            <b style={{ color: "#F4EFE6", fontSize: 16 }}>{n}</b>
            {label}
          </div>
        ))}
      </div>

      {/* rodapé Wi-Fi */}
      <div
        style={{
          marginTop: "auto",
          fontSize: 11,
          color: "#8F887D",
        }}
      >
        Wi-Fi: Dashi Sushi · Peça a senha no balcão
      </div>
    </div>
  );
}
