import type { Pagamento } from "./types";

export type FormaRecebimento =
  | "dinheiro"
  | "pix"
  | "debito"
  | "credito_vista"
  | "credito_2x"
  | "credito_3x"
  | "credito_4x";

export interface TaxasMaquininha {
  taxaPix: number;
  taxaDebito: number;
  taxaCreditoVista: number;
  taxaCredito2x: number;
  taxaCredito3x: number;
  taxaCredito4x: number;
}

export const FORMAS_RECEBIMENTO: { forma: FormaRecebimento; label: string }[] = [
  { forma: "dinheiro", label: "Dinheiro" },
  { forma: "pix", label: "Pix" },
  { forma: "debito", label: "Débito" },
  { forma: "credito_vista", label: "Crédito à vista" },
  { forma: "credito_2x", label: "Crédito 2x" },
  { forma: "credito_3x", label: "Crédito 3x" },
  { forma: "credito_4x", label: "Crédito 4x" },
];

/** Percentual da maquininha pra cada forma de recebimento — dinheiro nunca
 * tem taxa (não passa por maquininha nenhuma). */
export function percentualDaForma(forma: FormaRecebimento, taxas: TaxasMaquininha): number {
  switch (forma) {
    case "pix":
      return taxas.taxaPix;
    case "debito":
      return taxas.taxaDebito;
    case "credito_vista":
      return taxas.taxaCreditoVista;
    case "credito_2x":
      return taxas.taxaCredito2x;
    case "credito_3x":
      return taxas.taxaCredito3x;
    case "credito_4x":
      return taxas.taxaCredito4x;
    default:
      return 0;
  }
}

/** Total já com a taxa da maquininha repassada pro cliente — pra dona
 * receber o valor cheio da conta mesmo quando ele paga parcelado. */
export function totalComTaxa(total: number, forma: FormaRecebimento, taxas: TaxasMaquininha): number {
  return total * (1 + percentualDaForma(forma, taxas) / 100);
}

/** Monta o objeto de taxas a partir da linha de `configuracoes` (ou dos
 * defaults da maquininha da Dashi Sushi, se o restaurante ainda não tiver
 * linha de configuração salva). */
export function taxasDeConfig(config: Partial<TaxasMaquininha> | null | undefined): TaxasMaquininha {
  return {
    taxaPix: config?.taxaPix ?? 0,
    taxaDebito: config?.taxaDebito ?? 1.39,
    taxaCreditoVista: config?.taxaCreditoVista ?? 3.34,
    taxaCredito2x: config?.taxaCredito2x ?? 7.29,
    taxaCredito3x: config?.taxaCredito3x ?? 8.35,
    taxaCredito4x: config?.taxaCredito4x ?? 9.23,
  };
}

/** A forma de recebimento granular (débito, crédito 3x, etc.) só existe pra
 * calcular a taxa na tela — o que fica gravado no pedido continua sendo a
 * forma "grande" que o resto do sistema (relatórios, fechamento de caixa)
 * já entende. */
export function pagamentoDaForma(forma: FormaRecebimento): Pagamento {
  if (forma === "pix") return "pix";
  if (forma === "dinheiro") return "dinheiro";
  return "cartao";
}
