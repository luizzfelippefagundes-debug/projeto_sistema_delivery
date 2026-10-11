"use client";

import { Check, Copy, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useState, useTransition } from "react";
import { type FormularioCartao, pagarPedidoComCartao } from "@/actions/pedidos.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarCPF } from "@/lib/cpf";
import { fmtBRL } from "@/lib/data";

function useTempoRestante(expiraEm: number) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);
  const seg = Math.max(0, Math.floor((expiraEm - agora) / 1_000));
  return `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;
}

export function PixPagamento({
  qrCodeBase64,
  copiaECola,
  valor,
  expiraEm,
}: {
  qrCodeBase64: string;
  copiaECola: string;
  valor: number;
  expiraEm: number;
}) {
  const [copiado, setCopiado] = useState(false);
  const restante = useTempoRestante(expiraEm);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(copiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2_000);
    } catch {
      // sem permissão de área de transferência: o código continua visível pra copiar na mão
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div>
        <p className="font-semibold">Pague {fmtBRL(valor)} no Pix</p>
        <p className="text-sm text-muted-foreground">
          Seu pedido vai pra cozinha assim que o Pix cair. Expira em <span className="num font-medium">{restante}</span>.
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem em base64 vinda do Asaas */}
      <img
        src={`data:image/png;base64,${qrCodeBase64}`}
        alt="QR Code do Pix"
        className="size-56 rounded-lg bg-white p-2"
      />
      <p className="w-full break-all rounded-lg border border-border p-2 text-left text-xs text-muted-foreground">
        {copiaECola}
      </p>
      <Button className="h-11 w-full" onClick={copiar}>
        {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copiado ? "Código copiado!" : "Copiar código Pix"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Abra o app do seu banco, escolha Pix copia e cola e cole o código. Esta tela atualiza sozinha quando o
        pagamento for confirmado.
      </p>
    </div>
  );
}

const digitos = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

const mascaras: Partial<Record<keyof FormularioCartao, (v: string) => string>> = {
  numero: (v) => digitos(v, 19).replace(/(\d{4})(?=\d)/g, "$1 "),
  validade: (v) => digitos(v, 4).replace(/^(\d{2})(\d)/, "$1/$2"),
  cvv: (v) => digitos(v, 4),
  cpfTitular: formatarCPF,
  cep: (v) => digitos(v, 8).replace(/^(\d{5})(\d)/, "$1-$2"),
  telefone: (v) => digitos(v, 11),
};

export function CartaoPagamento({
  pedidoId,
  valor,
  telefoneInicial,
  emailInicial,
  cpfInicial,
}: {
  pedidoId: string;
  valor: number;
  telefoneInicial?: string | null;
  emailInicial?: string | null;
  cpfInicial?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState<FormularioCartao>({
    nomeNoCartao: "",
    numero: "",
    validade: "",
    cvv: "",
    cpfTitular: formatarCPF(cpfInicial ?? ""),
    email: emailInicial ?? "",
    cep: "",
    numeroEndereco: "",
    telefone: digitos(telefoneInicial ?? "", 11),
  });

  function campo(nome: keyof FormularioCartao) {
    const mascara = mascaras[nome];
    return {
      id: `cartao-${nome}`,
      value: form[nome],
      className: "h-10",
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [nome]: mascara ? mascara(e.target.value) : e.target.value })),
    };
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const resultado = await pagarPedidoComCartao(pedidoId, form);
      if ("error" in resultado) {
        setErro(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  const linha = (label: string, el: React.ReactNode, htmlFor: string) => (
    <div className="flex flex-1 flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {el}
    </div>
  );

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <div>
        <p className="font-semibold">Pague {fmtBRL(valor)} no cartão de crédito</p>
        <p className="text-sm text-muted-foreground">Seu pedido vai pra cozinha assim que o pagamento for aprovado.</p>
      </div>
      {linha("Nome impresso no cartão", <Input autoComplete="cc-name" {...campo("nomeNoCartao")} />, "cartao-nomeNoCartao")}
      {linha(
        "Número do cartão",
        <Input inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" {...campo("numero")} />,
        "cartao-numero",
      )}
      <div className="flex gap-3">
        {linha("Validade", <Input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" {...campo("validade")} />, "cartao-validade")}
        {linha("CVV", <Input inputMode="numeric" autoComplete="cc-csc" placeholder="123" {...campo("cvv")} />, "cartao-cvv")}
      </div>
      {linha(
        "CPF do titular do cartão",
        <Input inputMode="numeric" placeholder="000.000.000-00" {...campo("cpfTitular")} />,
        "cartao-cpfTitular",
      )}
      {linha("E-mail", <Input type="email" autoComplete="email" {...campo("email")} />, "cartao-email")}
      <div className="flex gap-3">
        {linha("CEP", <Input inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" {...campo("cep")} />, "cartao-cep")}
        {linha("Nº do endereço", <Input {...campo("numeroEndereco")} />, "cartao-numeroEndereco")}
      </div>
      {linha("Telefone com DDD", <Input inputMode="tel" autoComplete="tel-national" {...campo("telefone")} />, "cartao-telefone")}

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Processando…" : `Pagar ${fmtBRL(valor)}`}
      </Button>
      <p className="flex items-start justify-center gap-1 text-center text-xs text-muted-foreground">
        <Lock className="mt-px size-3 shrink-0" />
        Pagamento processado pelo Asaas. Não guardamos os dados do seu cartão.
      </p>
    </form>
  );
}
