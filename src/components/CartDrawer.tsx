"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, Loader2, Minus, Pencil, Plus, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { criarPedidoCliente, criarPedidoMesa } from "@/actions/pedidos.actions";
import { calcularEntregaReal } from "@/actions/entrega.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ItemDetalheDialog from "@/components/ItemDetalheDialog";
import CheckoutStepper from "@/components/CheckoutStepper";
import type { ZonaEntregaResumo } from "@/components/CardapioClient";
import type { ItemDoCardapio } from "@/components/CardapioItemCard";
import { fmtBRL } from "@/lib/data";
import { encontrarZona } from "@/lib/entrega";
import type { DistanciaReal } from "@/lib/googleMaps";
import { formatarCPF, validarCPF } from "@/lib/cpf";
import { useCart, type CartItem } from "@/lib/cart";
import { salvarPedidoConvidado } from "@/lib/pedidosConvidado";
import type { Pagamento } from "@/lib/types";
import { type FormaRecebimento, type TaxasMaquininha, percentualDaForma, totalComTaxa } from "@/lib/taxaMaquininha";

type Passo = "carrinho" | "entrega" | "resumo" | "pagamento" | "confirmado";
type Tipo = "retirada" | "delivery";

const STORAGE_KEY = "dashi-sushi-checkout-v1";

interface DadosEntrega {
  nome: string;
  telefone: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  referencia: string;
}

const ENTREGA_VAZIA: DadosEntrega = {
  nome: "",
  telefone: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  referencia: "",
};

function montarEndereco(d: DadosEntrega): string {
  let linha = `${d.rua.trim()}, ${d.numero.trim()}`;
  if (d.complemento.trim()) linha += ` - ${d.complemento.trim()}`;
  linha += ` - ${d.bairro.trim()}`;
  if (d.referencia.trim()) linha += ` (Ref: ${d.referencia.trim()})`;
  return linha;
}

const ETAPAS_MESA = [
  { chave: "carrinho", label: "Sacola" },
  { chave: "resumo", label: "Confirmar" },
] as const;

export default function CartDrawer({
  restauranteId,
  zonasEntrega,
  enderecoLoja,
  taxasMaquininha,
  itensPorId,
  open,
  onOpenChange,
  mesa,
  pagamentoOnline = false,
}: {
  restauranteId: string;
  zonasEntrega: ZonaEntregaResumo[];
  enderecoLoja: string | null;
  taxasMaquininha: TaxasMaquininha;
  itensPorId: Record<string, ItemDoCardapio>;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Presente quando o carrinho foi aberto pelo QR code de uma mesa — pula
   * entrega e pagamento, manda direto pra cozinha via criarPedidoMesa. */
  mesa?: number;
  pagamentoOnline?: boolean;
}) {
  const { items, total, setQty, clear } = useCart();
  const { user } = useUser();
  const router = useRouter();

  const [passo, setPasso] = useState<Passo>("carrinho");
  const [tipo, setTipo] = useState<Tipo>("delivery");
  const [entrega, setEntrega] = useState<DadosEntrega>(ENTREGA_VAZIA);
  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [formaRecebimento, setFormaRecebimento] = useState<FormaRecebimento>("pix");
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState<CartItem | null>(null);
  const [distanciaReal, setDistanciaReal] = useState<DistanciaReal | null>(null);
  const [calculandoDistancia, setCalculandoDistancia] = useState(false);
  const [cpfNota, setCpfNota] = useState("");
  const [cpfPagador, setCpfPagador] = useState("");

  const zonaEncontrada = useMemo(
    () => (tipo === "delivery" ? encontrarZona(zonasEntrega, entrega.bairro) : null),
    [tipo, zonasEntrega, entrega.bairro],
  );
  const taxaEntrega = tipo === "delivery" ? (zonaEncontrada?.taxaEntrega ?? 0) : 0;
  const totalComEntrega = total + taxaEntrega;
  const percentualCartao = percentualDaForma(formaRecebimento, taxasMaquininha);
  const totalFinal = totalComTaxa(totalComEntrega, formaRecebimento, taxasMaquininha);

  const enderecoDestino =
    tipo === "delivery" && entrega.rua.trim() && entrega.numero.trim() && entrega.bairro.trim()
      ? `${entrega.rua}, ${entrega.numero} - ${entrega.bairro}`
      : "";

  // Distância/tempo reais (Google Maps) — só dispara quando a rua, número e
  // bairro estão preenchidos, com debounce pra não bater na API a cada
  // letra digitada. Sem GOOGLE_MAPS_API_KEY configurada, a action devolve
  // null e a tela mantém o tempo estimado manual da zona.
  useEffect(() => {
    if (!enderecoDestino || !enderecoLoja) {
      setDistanciaReal(null);
      return;
    }
    setCalculandoDistancia(true);
    const id = setTimeout(() => {
      calcularEntregaReal(restauranteId, enderecoDestino)
        .then(setDistanciaReal)
        .catch(() => setDistanciaReal(null))
        .finally(() => setCalculandoDistancia(false));
    }, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enderecoDestino, enderecoLoja, restauranteId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntrega((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {
      // sem dado salvo, começa em branco
    }
  }, []);

  // Pré-preenche com o nome da conta pra quem estiver logado — só um
  // atalho, continua editável (e é o único jeito de saber o nome de quem
  // não tem conta).
  useEffect(() => {
    if (!user?.fullName) return;
    setEntrega((prev) => (prev.nome ? prev : { ...prev, nome: user.fullName! }));
  }, [user?.fullName]);

  function atualizarEntrega(campo: keyof DadosEntrega, valor: string) {
    setEntrega((prev) => ({ ...prev, [campo]: valor }));
  }

  function irParaEntrega() {
    setErro(null);
    setPasso(mesa != null ? "resumo" : "entrega");
  }

  function confirmarPedidoMesa() {
    if (mesa == null) return;
    setErro(null);
    startTransition(async () => {
      try {
        const { pedidoId } = await criarPedidoMesa({
          restauranteId,
          mesa,
          itens: items.map((i) => ({
            itemCardapioId: i.itemCardapioId,
            quantidade: i.qtd,
            observacao: i.escolhas?.length ? i.escolhas.map((e) => `${e.quantidade}x ${e.nome}`).join(", ") : null,
          })),
        });
        setPedidoId(pedidoId);
        clear();
        setPasso("confirmado");
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra enviar o pedido.");
      }
    });
  }

  function confirmarEntrega() {
    if (!entrega.nome.trim()) {
      setErro("Informe seu nome.");
      return;
    }
    if (!entrega.telefone.trim()) {
      setErro("Informe um telefone pra contato.");
      return;
    }
    if (tipo === "delivery" && (!entrega.rua.trim() || !entrega.numero.trim() || !entrega.bairro.trim())) {
      setErro("Preencha rua, número e bairro.");
      return;
    }
    setErro(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entrega));
    } catch {
      // localStorage indisponível, segue sem salvar
    }
    setPasso("resumo");
  }

  function confirmarPagamento() {
    setErro(null);
    if (pagamentoOnline && !validarCPF(cpfPagador)) {
      setErro("Informe um CPF válido pra pagar.");
      return;
    }
    const cliente = entrega.nome.trim() || user?.fullName || user?.username || "Cliente do site";
    const enderecoFinal = tipo === "retirada" ? "Retirada no balcão" : montarEndereco(entrega);
    startTransition(async () => {
      try {
        const resultado = await criarPedidoCliente({
          restauranteId,
          itens: items.map((i) => ({
            itemCardapioId: i.itemCardapioId,
            quantidade: i.qtd,
            observacao: i.escolhas?.length ? i.escolhas.map((e) => `${e.quantidade}x ${e.nome}`).join(", ") : null,
          })),
          endereco: enderecoFinal,
          bairro: tipo === "delivery" ? entrega.bairro : null,
          telefone: entrega.telefone,
          forma: formaRecebimento,
          clienteNome: cliente,
          cpfNota: (pagamentoOnline ? cpfPagador : cpfNota).trim() || null,
          cpfPagador: pagamentoOnline ? cpfPagador : null,
        });
        if ("error" in resultado) {
          setErro(resultado.error);
          return;
        }
        const { pedidoId } = resultado;
        salvarPedidoConvidado(pedidoId);
        clear();
        setCpfNota("");
        if (pagamentoOnline) {
          // O Pix e o cartão são pagos na página do pedido.
          onOpenChange(false);
          setPasso("carrinho");
          router.push(`/pedido/${pedidoId}`);
          return;
        }
        setPedidoId(pedidoId);
        setPasso("confirmado");
      } catch (e) {
        // Em produção o Next troca a mensagem de erro de server action por um texto genérico do React.
        const msg = e instanceof Error && !e.message.includes("react.dev/errors") ? e.message : null;
        setErro(msg ?? "Não deu pra confirmar o pedido. Tente de novo em instantes.");
      }
    });
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v && passo === "confirmado") {
      setTimeout(() => setPasso("carrinho"), 300);
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>
            {passo === "carrinho" && "Sua sacola"}
            {passo === "entrega" && "Dados de entrega"}
            {passo === "resumo" && "Resumo do pedido"}
            {passo === "pagamento" && "Pagamento"}
            {passo === "confirmado" && "Pedido confirmado"}
          </DialogTitle>
        </DialogHeader>
        <CheckoutStepper etapaAtual={passo} etapas={mesa != null ? ETAPAS_MESA : undefined} />

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
          {passo === "carrinho" && (
            <>
              <div className="flex flex-col gap-3">
                {items.length === 0 && <p className="text-sm text-muted-foreground">Sua sacola está vazia.</p>}
                {items.map((i) => (
                  <div key={i.cartItemId} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span>
                        {i.qtd}x {i.nome}
                      </span>
                      {i.escolhas && i.escolhas.length > 0 && (
                        <>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {i.escolhas.map((e) => `${e.quantidade}x ${e.nome}`).join(", ")}
                          </p>
                          <button
                            type="button"
                            onClick={() => setEditando(i)}
                            className="mt-0.5 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <Pencil className="size-3" /> Editar peças
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="icon-sm" variant="outline" onClick={() => setQty(i.cartItemId, i.qtd - 1)}>
                        <Minus />
                      </Button>
                      <span className="num w-16 text-right">{fmtBRL(i.preco * i.qtd)}</span>
                      <Button size="icon-sm" variant="outline" onClick={() => setQty(i.cartItemId, i.qtd + 1)}>
                        <Plus />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {items.length > 0 && (
                <>
                  <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
                    <span>Total</span>
                    <span className="num">{fmtBRL(total)}</span>
                  </div>

                  <Button className="w-full" onClick={irParaEntrega}>
                    Continuar
                  </Button>
                </>
              )}
            </>
          )}

          {passo === "entrega" && (
            <>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Como vai ser?
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant={tipo === "delivery" ? "default" : "outline"} onClick={() => setTipo("delivery")}>
                    🛵 Delivery
                  </Button>
                  <Button size="sm" variant={tipo === "retirada" ? "default" : "outline"} onClick={() => setTipo("retirada")}>
                    🏠 Retirar no local
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nome">Seu nome</Label>
                <Input
                  id="nome"
                  value={entrega.nome}
                  onChange={(e) => atualizarEntrega("nome", e.target.value)}
                  placeholder="Como podemos te chamar?"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="telefone">Telefone pra contato</Label>
                <Input
                  id="telefone"
                  value={entrega.telefone}
                  onChange={(e) => atualizarEntrega("telefone", e.target.value)}
                  placeholder="(27) 99999-9999"
                  inputMode="tel"
                />
              </div>

              {tipo === "delivery" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Endereço de entrega
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <Label htmlFor="rua">Rua / Avenida</Label>
                      <Input id="rua" value={entrega.rua} onChange={(e) => atualizarEntrega("rua", e.target.value)} placeholder="Rua das Palmeiras" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="numero">Número</Label>
                      <Input id="numero" value={entrega.numero} onChange={(e) => atualizarEntrega("numero", e.target.value)} placeholder="120" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" value={entrega.bairro} onChange={(e) => atualizarEntrega("bairro", e.target.value)} placeholder="Centro" />
                  </div>

                  {entrega.bairro.trim() && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                      {calculandoDistancia ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <Bike className="size-4 shrink-0 text-primary" />
                      )}
                      {calculandoDistancia ? (
                        <span className="text-muted-foreground">Calculando distância…</span>
                      ) : distanciaReal ? (
                        <span>
                          <strong>{distanciaReal.distanciaKm} km</strong> · Chega em{" "}
                          <strong>{distanciaReal.duracaoMin} min</strong>
                        </span>
                      ) : zonaEncontrada ? (
                        <span>
                          Chega em <strong>{zonaEncontrada.tempoEstimadoMin} min</strong>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Estimativa de chegada não disponível pra esse bairro.</span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="complemento">Complemento (opcional)</Label>
                    <Input
                      id="complemento"
                      value={entrega.complemento}
                      onChange={(e) => atualizarEntrega("complemento", e.target.value)}
                      placeholder="Apto, bloco, casa dos fundos…"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="referencia">Ponto de referência (opcional)</Label>
                    <Input
                      id="referencia"
                      value={entrega.referencia}
                      onChange={(e) => atualizarEntrega("referencia", e.target.value)}
                      placeholder="Perto do mercado tal…"
                    />
                  </div>
                </div>
              )}

              {erro && <p className="text-sm text-destructive">{erro}</p>}
            </>
          )}

          {passo === "resumo" && (
            <>
              <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3 text-sm">
                {items.map((i) => (
                  <div key={i.cartItemId} className="flex justify-between text-muted-foreground">
                    <div>
                      <span>
                        {i.qtd}x {i.nome}
                      </span>
                      {i.escolhas && i.escolhas.length > 0 && (
                        <p className="text-xs">{i.escolhas.map((e) => `${e.quantidade}x ${e.nome}`).join(", ")}</p>
                      )}
                    </div>
                    <span className="num">{fmtBRL(i.preco * i.qtd)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resumo de valores
                </p>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="num">{fmtBRL(total)}</span>
                </div>
                {mesa == null && tipo === "delivery" && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Taxa de entrega</span>
                    <span className="num">{taxaEntrega > 0 ? fmtBRL(taxaEntrega) : "A combinar"}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="num">{fmtBRL(mesa != null ? total : totalComEntrega)}</span>
                </div>
              </div>

              {/* No pagamento online o CPF é pedido uma vez só, no passo de pagamento. */}
              {mesa == null && !pagamentoOnline && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cpf-nota">CPF na nota (opcional)</Label>
                  <Input
                    id="cpf-nota"
                    value={cpfNota}
                    onChange={(e) => setCpfNota(formatarCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                  />
                  {cpfNota.replace(/\D/g, "").length === 11 && !validarCPF(cpfNota) && (
                    <p className="text-xs text-destructive">Esse CPF não parece válido.</p>
                  )}
                </div>
              )}

              {mesa != null && erro && <p className="text-sm text-destructive">{erro}</p>}
            </>
          )}

          {passo === "pagamento" && (
            <>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Forma de pagamento</p>
                <div className="flex flex-col gap-1.5">
                  {(
                    [
                      { forma: "pix" as FormaRecebimento, label: "Pix" },
                      { forma: "credito_vista" as FormaRecebimento, label: "Cartão de crédito" },
                    ] as { forma: FormaRecebimento; label: string }[]
                  ).map(({ forma, label }) => {
                    const pct = percentualDaForma(forma, taxasMaquininha);
                    const totalForma = totalComTaxa(totalComEntrega, forma, taxasMaquininha);
                    const selecionado = formaRecebimento === forma;
                    return (
                      <button
                        key={forma}
                        type="button"
                        onClick={() => setFormaRecebimento(forma)}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${selecionado ? "border-primary bg-primary/5 font-semibold" : "border-border hover:border-primary/50"}`}
                      >
                        <span>{label}</span>
                        <div className="text-right">
                          {pct > 0 && (
                            <span className="block text-xs text-muted-foreground">+{pct}% de taxa</span>
                          )}
                          <span className="num font-semibold">{fmtBRL(totalForma)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {pagamentoOnline && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cpf-pagador">CPF</Label>
                  <Input
                    id="cpf-pagador"
                    value={cpfPagador}
                    onChange={(e) => setCpfPagador(formatarCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                  />
                  {cpfPagador.replace(/\D/g, "").length === 11 && !validarCPF(cpfPagador) && (
                    <p className="text-xs text-destructive">Esse CPF não parece válido.</p>
                  )}
                </div>
              )}

              <p className="rounded-xl border border-border p-3 text-center text-sm text-muted-foreground">
                {pagamentoOnline
                  ? formaRecebimento === "pix"
                    ? "Na próxima tela aparece o QR Code e o código copia e cola. Seu pedido vai pra cozinha assim que o Pix cair. Você tem 15 minutos pra pagar."
                    : "Na próxima tela você digita os dados do cartão. Seu pedido vai pra cozinha assim que o pagamento for aprovado."
                  : `Pague na hora da ${tipo === "retirada" ? "retirada" : "entrega"}, direto com ${tipo === "retirada" ? "quem atender" : "o motoboy"}.`}
              </p>

              {erro && <p className="text-sm text-destructive">{erro}</p>}
            </>
          )}

          {passo === "confirmado" && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="text-4xl">🍣</div>
              <h3 className="font-heading text-lg font-semibold">
                {mesa != null ? `Pedido enviado pra Mesa ${mesa}!` : `Pedido #${pedidoId?.slice(0, 8)} recebido!`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {mesa != null
                  ? "Já mandamos pra cozinha. Quer pedir mais alguma coisa? É só voltar no cardápio."
                  : "Já mandamos pra cozinha. Acompanhe o status do seu pedido em tempo real."}
              </p>
            </div>
          )}
        </div>

        {passo === "entrega" && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <Button onClick={confirmarEntrega}>Continuar</Button>
            <Button variant="outline" onClick={() => setPasso("carrinho")}>
              Voltar
            </Button>
          </div>
        )}
        {passo === "resumo" && mesa != null && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <Button disabled={pending} onClick={confirmarPedidoMesa}>
              {pending ? "Enviando…" : "Enviar pedido pra cozinha"}
            </Button>
            <Button variant="outline" onClick={() => setPasso("carrinho")}>
              Voltar
            </Button>
          </div>
        )}
        {passo === "resumo" && mesa == null && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <Button onClick={() => setPasso("pagamento")}>Continuar pro pagamento</Button>
            <Button variant="outline" onClick={() => setPasso("entrega")}>
              Voltar
            </Button>
          </div>
        )}
        {passo === "pagamento" && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <div className="flex justify-between text-sm font-bold">
              <span>Total{percentualCartao > 0 ? ` (com taxa ${percentualCartao}%)` : ""}</span>
              <span className="num">{fmtBRL(totalFinal)}</span>
            </div>
            <Button disabled={pending} onClick={confirmarPagamento}>
              {pagamentoOnline
                ? pending
                  ? "Gerando pagamento…"
                  : formaRecebimento === "pix"
                    ? "Gerar Pix"
                    : "Pagar com cartão"
                : pending
                  ? "Confirmando…"
                  : "Confirmar pedido"}
            </Button>
            <Button variant="outline" onClick={() => setPasso("resumo")}>
              Voltar
            </Button>
          </div>
        )}
        {passo === "confirmado" && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            {mesa == null && pedidoId && (
              <Link href={`/pedido/${pedidoId}`} className="w-full">
                <Button className="w-full">Acompanhar pedido</Button>
              </Link>
            )}
            <Button variant={mesa != null ? "default" : "outline"} onClick={() => handleOpenChange(false)}>
              {mesa != null ? "Voltar pro cardápio" : "Fechar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <ItemDetalheDialog
      item={editando ? (itensPorId[editando.itemCardapioId] ?? null) : null}
      tint="bg-status-neutral-bg text-status-neutral-fg"
      icon={UtensilsCrossed}
      open={!!editando}
      onOpenChange={(v) => !v && setEditando(null)}
      edicao={editando ? { cartItemId: editando.cartItemId, escolhasIniciais: editando.escolhas ?? [] } : undefined}
    />
    </>
  );
}
