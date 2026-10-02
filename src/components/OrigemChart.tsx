"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { fmtBRL } from "@/lib/data";

const chartConfig = {
  valor: { label: "Faturado", color: "var(--color-primary)" },
} satisfies ChartConfig;

export interface ResumoOrigem {
  quantidade: number;
  valor: number;
}

export default function OrigemChart({
  label,
  mesa,
  delivery,
}: {
  label: string;
  mesa: ResumoOrigem;
  delivery: ResumoOrigem;
}) {
  const data = [
    { origem: "Mesa", valor: mesa.valor, quantidade: mesa.quantidade },
    { origem: "Delivery", valor: delivery.valor, quantidade: delivery.quantidade },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Mesa x Delivery — {label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mesa</span>
            <span className="num font-heading text-lg font-semibold">{fmtBRL(mesa.valor)}</span>
            <span className="text-xs text-muted-foreground">
              {mesa.quantidade} pedido{mesa.quantidade === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery</span>
            <span className="num font-heading text-lg font-semibold">{fmtBRL(delivery.valor)}</span>
            <span className="text-xs text-muted-foreground">
              {delivery.quantidade} pedido{delivery.quantidade === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="aspect-auto h-[180px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="origem" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => fmtBRL(Number(value))}
                  labelKey="origem"
                  nameKey="valor"
                />
              }
            />
            <Bar dataKey="valor" fill="var(--color-valor)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
