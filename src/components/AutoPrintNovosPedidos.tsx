"use client";

import { useEffect, useRef, useState } from "react";

const CHAVE = "comanda-auto-impressas";
const LIMITE = 300;

function lerImpressos(): Set<string> {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return new Set(bruto ? (JSON.parse(bruto) as string[]) : []);
  } catch {
    return new Set();
  }
}

function salvarImpressos(ids: Set<string>) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify([...ids].slice(-LIMITE)));
  } catch {
    // localStorage indisponível — segue sem persistir, só não evita reimpressão num reload
  }
}

/** Imprime a comanda sozinho assim que um pedido novo aparece na tela da
 * cozinha — sem precisar clicar em nada. Usa um iframe escondido (não uma
 * aba nova via window.open) pra não esbarrar no bloqueador de pop-up do
 * navegador, que trava qualquer abertura de janela disparada fora de um
 * clique direto da pessoa. Guarda no localStorage quais pedidos já
 * imprimiu, pra não reimprimir tudo de novo só porque a página recarregou
 * (a tela da cozinha já atualiza sozinha a cada 15s).
 *
 * Só dispara de verdade (sem precisar confirmar nada) com o navegador
 * configurado em modo kiosk-printing numa máquina fixa — sem isso, o
 * próprio navegador ainda abre a caixa de diálogo de impressão. */
export default function AutoPrintNovosPedidos({ idsNovos }: { idsNovos: string[] }) {
  const [paraImprimir, setParaImprimir] = useState<string[]>([]);
  const impressosRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!impressosRef.current) impressosRef.current = lerImpressos();
    const impressos = impressosRef.current;
    const novos = idsNovos.filter((id) => !impressos.has(id));
    if (novos.length === 0) return;
    for (const id of novos) impressos.add(id);
    salvarImpressos(impressos);
    setParaImprimir((atual) => [...atual, ...novos]);
  }, [idsNovos]);

  return (
    <>
      {paraImprimir.map((id) => (
        // Sem display:none de propósito — alguns navegadores não imprimem
        // o conteúdo de um iframe que está com display:none.
        <iframe
          key={id}
          src={`/imprimir/${id}`}
          title={`Comanda do pedido ${id}`}
          style={{ position: "fixed", width: 0, height: 0, border: "none", opacity: 0 }}
        />
      ))}
    </>
  );
}
