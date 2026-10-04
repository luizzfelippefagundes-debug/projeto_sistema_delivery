import EnderecoLojaCard from "@/components/EnderecoLojaCard";
import FecharCaixaButton from "@/components/FecharCaixaButton";
import OrigemChart, { type ResumoOrigem } from "@/components/OrigemChart";
import TaxasMaquininhaCard from "@/components/TaxasMaquininhaCard";
import ZonasEntregaManager from "@/components/ZonasEntregaManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getConfiguracoes } from "@/db/queries/configuracoes";
import { getZonasEntrega } from "@/db/queries/entrega";
import { getUltimoFechamento } from "@/db/queries/fechamentos";
import { getPedidosDesde, getPedidosDoDia } from "@/db/queries/pedidos";
import { fmtBRL, fmtHora, inicioDoDia } from "@/lib/data";
import { contaComoFaturamento } from "@/lib/faturamento";
import { requireFuncionarioAccess } from "@/lib/funcionarioAuth";
import { taxasDeConfig } from "@/lib/taxaMaquininha";
import type { Origem, OrderStatus, Pagamento } from "@/lib/types";

function inicioDaSemana() {
  const d = inicioDoDia();
  d.setDate(d.getDate() - 7);
  return d;
}

function inicioDoMes() {
  const d = inicioDoDia();
  d.setDate(d.getDate() - 30);
  return d;
}

function resumoPeriodo(pedidos: { origem: Origem; total: number; formaPagamento: Pagamento | null; status: OrderStatus }[]) {
  const porForma: Record<Pagamento, number> = { dinheiro: 0, cartao: 0, pix: 0 };
  const faturados = pedidos.filter(contaComoFaturamento);
  let faturamento = 0;
  for (const p of faturados) faturamento += p.total;
  for (const p of faturados) {
    if (p.formaPagamento) porForma[p.formaPagamento] += p.total;
  }
  const ticketMedio = faturados.length ? faturamento / faturados.length : 0;

  const porOrigem: Record<Origem, ResumoOrigem> = {
    salao: { quantidade: 0, valor: 0 },
    delivery: { quantidade: 0, valor: 0 },
  };
  for (const p of faturados) {
    porOrigem[p.origem].quantidade += 1;
    porOrigem[p.origem].valor += p.total;
  }

  return { porForma, faturamento, ticketMedio, quantidade: pedidos.length, porOrigem };
}

function ResumoCaixa({
  label,
  resumo,
}: {
  label: string;
  resumo: ReturnType<typeof resumoPeriodo>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Recebido — {label}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dinheiro</span>
            <span className="num">{fmtBRL(resumo.porForma.dinheiro)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cartão</span>
            <span className="num">{fmtBRL(resumo.porForma.cartao)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pix</span>
            <span className="num">{fmtBRL(resumo.porForma.pix)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Total recebido (pedidos concluídos)</span>
            <span className="num">{fmtBRL(resumo.porForma.dinheiro + resumo.porForma.cartao + resumo.porForma.pix)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Faturamento</p>
            <p className="num font-heading text-xl font-semibold">{fmtBRL(resumo.faturamento)}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ticket médio</p>
            <p className="num font-heading text-xl font-semibold">{fmtBRL(resumo.ticketMedio)}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pedidos</p>
            <p className="num font-heading text-xl font-semibold">{resumo.quantidade}</p>
          </CardContent>
        </Card>
      </div>

      <OrigemChart label={label} mesa={resumo.porOrigem.salao} delivery={resumo.porOrigem.delivery} />
    </div>
  );
}

export default async function FinanceiroPage() {
  const dono = await requireFuncionarioAccess("dono");

  const [pedidosHoje, pedidosSemana, pedidosMes, ultimoFechamento, config, zonas] = await Promise.all([
    getPedidosDoDia(dono.restauranteId),
    getPedidosDesde(dono.restauranteId, inicioDaSemana()),
    getPedidosDesde(dono.restauranteId, inicioDoMes()),
    getUltimoFechamento(dono.restauranteId),
    getConfiguracoes(dono.restauranteId),
    getZonasEntrega(dono.restauranteId),
  ]);

  const resumoDia = resumoPeriodo(pedidosHoje);
  const resumoSemana = resumoPeriodo(pedidosSemana);
  const resumoMes = resumoPeriodo(pedidosMes);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold">Financeiro</h2>
          <p className="text-sm text-muted-foreground">
            {ultimoFechamento ? `Último fechamento: ${fmtHora(ultimoFechamento.fechadoEm.getTime())}` : "Nenhum fechamento ainda hoje"}
          </p>
        </div>
        <FecharCaixaButton />
      </div>

      <Tabs defaultValue="dia">
        <TabsList>
          <TabsTrigger value="dia">Dia</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
        </TabsList>
        <TabsContent value="dia" className="mt-4">
          <ResumoCaixa label="hoje" resumo={resumoDia} />
        </TabsContent>
        <TabsContent value="semana" className="mt-4">
          <ResumoCaixa label="últimos 7 dias" resumo={resumoSemana} />
        </TabsContent>
        <TabsContent value="mes" className="mt-4">
          <ResumoCaixa label="últimos 30 dias" resumo={resumoMes} />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Meta de faturamento do mês</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-heading text-lg">
            {config?.metaFaturamentoMensal ? fmtBRL(config.metaFaturamentoMensal) : "Não definida"}
          </p>
        </CardContent>
      </Card>

      <TaxasMaquininhaCard taxasAtuais={taxasDeConfig(config)} />
      <EnderecoLojaCard enderecoAtual={config?.enderecoLoja ?? null} />
      <ZonasEntregaManager zonas={zonas} />
    </div>
  );
}
