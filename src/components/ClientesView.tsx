"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronUp, ChevronDown, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtBRL } from "@/lib/data";

const DIAS_SUMINDO = 14;

export interface ClienteResumo {
  nome: string;
  qtdPedidos: number;
  totalGasto: number;
  ultimoPedido: Date;
}

function diasAtras(data: Date) {
  return Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24));
}

type Coluna = "nome" | "qtdPedidos" | "totalGasto" | "ticketMedio" | "ultimoPedido";
type Direcao = "asc" | "desc";
type StatusFiltro = "todos" | "ativo" | "sumindo";

function StatusBadge({ ultimoPedido }: { ultimoPedido: Date }) {
  const dias = diasAtras(ultimoPedido);
  const sumindo = dias > DIAS_SUMINDO;
  return (
    <Badge className={sumindo ? "bg-status-warn-bg text-status-warn-fg" : "bg-status-ok-bg text-status-ok-fg"}>
      {sumindo ? `${dias}d sumido` : "Ativo"}
    </Badge>
  );
}

function SortIcon({ coluna, sortColuna, sortDir }: { coluna: Coluna; sortColuna: Coluna; sortDir: Direcao }) {
  if (coluna !== sortColuna) return <ChevronUp className="ml-1 inline size-3 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="ml-1 inline size-3" />
    : <ChevronDown className="ml-1 inline size-3" />;
}

export default function ClientesView({ clientes }: { clientes: ClienteResumo[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");
  const [sortColuna, setSortColuna] = useState<Coluna>("totalGasto");
  const [sortDir, setSortDir] = useState<Direcao>("desc");
  const [selecionado, setSelecionado] = useState<ClienteResumo | null>(null);

  function toggleSort(col: Coluna) {
    if (sortColuna === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortColuna(col); setSortDir("desc"); }
  }

  const filtrados = clientes
    .filter((c) => {
      if (busca && !c.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (statusFiltro === "ativo" && diasAtras(c.ultimoPedido) > DIAS_SUMINDO) return false;
      if (statusFiltro === "sumindo" && diasAtras(c.ultimoPedido) <= DIAS_SUMINDO) return false;
      return true;
    })
    .sort((a, b) => {
      let va: number, vb: number;
      if (sortColuna === "nome") { va = a.nome.localeCompare(b.nome); return sortDir === "asc" ? va : -va; }
      if (sortColuna === "qtdPedidos") { va = a.qtdPedidos; vb = b.qtdPedidos; }
      else if (sortColuna === "totalGasto") { va = a.totalGasto; vb = b.totalGasto; }
      else if (sortColuna === "ticketMedio") { va = a.totalGasto / a.qtdPedidos; vb = b.totalGasto / b.qtdPedidos; }
      else { va = a.ultimoPedido.getTime(); vb = b.ultimoPedido.getTime(); }
      return sortDir === "asc" ? va - vb : vb - va;
    });

  const statusOpts: { value: StatusFiltro; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "ativo", label: "Ativos" },
    { value: "sumindo", label: "Sumindo" },
  ];

  const colunas: { key: Coluna; label: string }[] = [
    { key: "nome", label: "Cliente" },
    { key: "qtdPedidos", label: "Pedidos" },
    { key: "totalGasto", label: "Total gasto" },
    { key: "ticketMedio", label: "Ticket médio" },
    { key: "ultimoPedido", label: "Último pedido" },
  ];

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex min-w-48 flex-1 items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {busca && (
            <button type="button" onClick={() => setBusca("")} className="absolute right-3 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-background p-1 shadow-sm">
          {statusOpts.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setStatusFiltro(o.value)}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${statusFiltro === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 && (
        <p className="pt-4 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
      )}

      {/* Desktop */}
      {filtrados.length > 0 && (
        <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                {colunas.map((col) => (
                  <TableHead key={col.key}>
                    <button type="button" onClick={() => toggleSort(col.key)} className="flex items-center whitespace-nowrap hover:text-foreground">
                      {col.label}
                      <SortIcon coluna={col.key} sortColuna={sortColuna} sortDir={sortDir} />
                    </button>
                  </TableHead>
                ))}
                <TableHead>Status</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((c) => (
                <TableRow
                  key={c.nome}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dono/clientes/${encodeURIComponent(c.nome)}`)}
                >
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.qtdPedidos}</TableCell>
                  <TableCell className="num">{fmtBRL(c.totalGasto)}</TableCell>
                  <TableCell className="num">{fmtBRL(c.totalGasto / c.qtdPedidos)}</TableCell>
                  <TableCell>{c.ultimoPedido.toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell><StatusBadge ultimoPedido={c.ultimoPedido} /></TableCell>
                  <TableCell><ChevronRight className="size-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile */}
      {filtrados.length > 0 && (
        <div className="flex flex-col gap-2 sm:hidden">
          {filtrados.map((c) => (
            <button
              key={c.nome}
              type="button"
              onClick={() => setSelecionado(c)}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{c.nome}</p>
                <p className="num text-xs text-muted-foreground">
                  {fmtBRL(c.totalGasto)} · {c.qtdPedidos} pedido(s) · {c.ultimoPedido.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge ultimoPedido={c.ultimoPedido} />
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal mobile */}
      <Dialog open={!!selecionado} onOpenChange={(v) => !v && setSelecionado(null)}>
        <DialogContent className="w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-sm">
          <DialogHeader className="p-4">
            <DialogTitle>{selecionado?.nome}</DialogTitle>
          </DialogHeader>
          {selecionado && (
            <div className="flex flex-col gap-4 px-4 pb-4">
              <StatusBadge ultimoPedido={selecionado.ultimoPedido} />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                  <p className="num font-semibold">{selecionado.qtdPedidos}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total gasto</p>
                  <p className="num font-semibold">{fmtBRL(selecionado.totalGasto)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Ticket médio</p>
                  <p className="num font-semibold">{fmtBRL(selecionado.totalGasto / selecionado.qtdPedidos)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Último pedido</p>
                  <p className="font-semibold">{selecionado.ultimoPedido.toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <Link href={`/dono/clientes/${encodeURIComponent(selecionado.nome)}`}>
                <Button variant="outline" className="w-full">Ver histórico completo</Button>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
