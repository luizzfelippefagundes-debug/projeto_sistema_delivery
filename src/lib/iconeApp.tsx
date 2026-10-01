const COR_MARCA = "#e0362b";

/** Monograma usado no favicon/ícone do PWA — fundo sólido na cor da marca
 * com a inicial do restaurante, desenhado via Satori (ImageResponse) em vez
 * de uma imagem, pra ficar nítido em qualquer tamanho sem depender de uma
 * foto de baixa resolução. */
export function IconeApp({ tamanho, letra = "D" }: { tamanho: number; letra?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: COR_MARCA,
      }}
    >
      <span
        style={{
          fontSize: tamanho * 0.56,
          fontWeight: 800,
          color: "#ffffff",
          fontFamily: "sans-serif",
          lineHeight: 1,
        }}
      >
        {letra}
      </span>
    </div>
  );
}
