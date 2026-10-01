"use client";

import { useEffect } from "react";

/** Aplica a cor de destaque do restaurante como `--primary` no elemento
 * raiz do documento, não num wrapper qualquer — diálogos, sheets e menus
 * desse app são renderizados via portal direto no `<body>`, fora da árvore
 * onde um wrapper normal alcançaria com CSS. */
export default function AplicarCorMarca({ cor }: { cor: string | null }) {
  useEffect(() => {
    if (!cor) return;
    const raiz = document.documentElement;
    const anterior = raiz.style.getPropertyValue("--primary");
    raiz.style.setProperty("--primary", cor);
    return () => {
      if (anterior) raiz.style.setProperty("--primary", anterior);
      else raiz.style.removeProperty("--primary");
    };
  }, [cor]);

  return null;
}
