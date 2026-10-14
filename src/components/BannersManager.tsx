"use client";

import { Check, ImagePlus, Plus, Search, Trash2, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { adicionarBanner, removerBanner } from "@/actions/cardapio.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BannerItem {
  id: string;
  nome: string;
  precoPromocional: number;
}

interface Banner {
  id: string;
  imagemUrl: string;
  linkUrl: string | null;
  titulo: string | null;
  itens: BannerItem[];
}

interface ItemCardapio {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
}

function formatPreco(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ModalItens({
  itensCardapio,
  onAdicionar,
  onFechar,
}: {
  itensCardapio: ItemCardapio[];
  onAdicionar: (itens: { nome: string; preco: string }[]) => void;
  onFechar: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<Record<string, string>>({});

  const termo = busca.toLowerCase();
  const filtrados = itensCardapio.filter((i) => i.nome.toLowerCase().includes(termo));
  const porCategoria = filtrados.reduce<Record<string, ItemCardapio[]>>((acc, i) => {
    (acc[i.categoria] ??= []).push(i);
    return acc;
  }, {});
  const qtd = Object.keys(selecionados).length;
  const algumSemPreco = Object.values(selecionados).some((p) => !p.trim());

  function alternar(item: ItemCardapio) {
    setSelecionados((prev) => {
      const novo = { ...prev };
      if (item.id in novo) delete novo[item.id];
      else novo[item.id] = item.preco.toFixed(2).replace(".", ",");
      return novo;
    });
  }

  function confirmar() {
    if (qtd === 0 || algumSemPreco) return;
    onAdicionar(
      itensCardapio
        .filter((i) => i.id in selecionados)
        .map((i) => ({ nome: i.nome, preco: selecionados[i.id].trim() })),
    );
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="flex h-[80vh] max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-4 py-3 pr-12">
          <DialogTitle className="flex items-baseline gap-2">
            Escolher itens
            {qtd > 0 && <span className="text-sm font-normal text-muted-foreground">{qtd} selecionado{qtd > 1 ? "s" : ""}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar item…" value={busca} onChange={(e) => setBusca(e.target.value)} className="h-10 pl-9" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {Object.entries(porCategoria).map(([cat, items]) => (
            <div key={cat}>
              <p className="sticky top-0 z-10 bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat}
              </p>
              {items.map((item) => {
                const marcado = item.id in selecionados;
                return (
                  <div key={item.id} className={`border-b border-border/50 ${marcado ? "bg-primary/10" : ""}`}>
                    <button
                      type="button"
                      onClick={() => alternar(item)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted"
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded border ${marcado ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50"}`}
                      >
                        {marcado && <Check className="size-3.5" />}
                      </span>
                      <span className="flex-1 font-medium">{item.nome}</span>
                      <span className="ml-2 shrink-0 text-sm text-muted-foreground">{formatPreco(item.preco)}</span>
                    </button>
                    {marcado && (
                      <div className="flex items-center gap-2 px-4 pb-3 pl-12">
                        <Label htmlFor={`preco-${item.id}`} className="shrink-0 text-xs text-muted-foreground">
                          Preço promo R$
                        </Label>
                        <Input
                          id={`preco-${item.id}`}
                          inputMode="decimal"
                          value={selecionados[item.id]}
                          onChange={(e) => setSelecionados((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          className="h-9 w-28 text-base"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {Object.keys(porCategoria).length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum item encontrado.</p>
          )}
        </div>

        <div className="border-t border-border p-4">
          <Button className="h-12 w-full text-base" onClick={confirmar} disabled={qtd === 0 || algumSemPreco}>
            {qtd === 0 ? "Selecione os itens" : `Adicionar ${qtd} ite${qtd > 1 ? "ns" : "m"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BannersManager({
  banners,
  itensCardapio,
}: {
  banners: Banner[];
  itensCardapio: ItemCardapio[];
}) {
  const [pending, startTransition] = useTransition();
  const [mostraForm, setMostraForm] = useState(false);
  const [mostraModal, setMostraModal] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [itensSelecionados, setItensSelecionados] = useState<{ nome: string; preco: string }[]>([]);
  const [base64Preview, setBase64Preview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBase64Preview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function adicionarItens(novos: { nome: string; preco: string }[]) {
    setItensSelecionados((prev) => [...prev, ...novos]);
  }

  function removerItemLista(idx: number) {
    setItensSelecionados((prev) => prev.filter((_, i) => i !== idx));
  }

  function cancelar() {
    setMostraForm(false);
    setTitulo("");
    setItensSelecionados([]);
    setBase64Preview(null);
  }

  function enviar() {
    if (!base64Preview) return;
    const itens = itensSelecionados
      .map((i) => ({ nome: i.nome, precoPromocional: parseFloat(i.preco.replace(",", ".")) }))
      .filter((i) => !isNaN(i.precoPromocional) && i.precoPromocional > 0);
    startTransition(async () => {
      await adicionarBanner(base64Preview, { titulo: titulo || undefined, itens });
      cancelar();
    });
  }

  function deletar(id: string) {
    startTransition(() => removerBanner(id));
  }

  return (
    <>
      {mostraModal && (
        <ModalItens
          itensCardapio={itensCardapio}
          onAdicionar={adicionarItens}
          onFechar={() => setMostraModal(false)}
        />
      )}

      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Banners aparecem no topo do cardápio. A imagem aparece inteira, no formato que você subir (quadrada, em pé ou deitada). Até 2 MB.
        </p>

        {!mostraForm ? (
          <Button onClick={() => setMostraForm(true)} className="w-full sm:w-fit gap-2 h-12 sm:h-9 text-base sm:text-sm">
            <ImagePlus className="size-5 sm:size-4" />
            Novo banner
          </Button>
        ) : (
          <div className="rounded-xl border border-border p-4 flex flex-col gap-5 bg-card">
            <p className="font-semibold">Novo banner</p>

            {/* Foto */}
            <div className="flex flex-col gap-2">
              <Label>Foto do banner</Label>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              {base64Preview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={base64Preview} alt="Preview" className="mx-auto block h-auto max-h-72 w-auto max-w-full" />
                  <button
                    type="button"
                    onClick={() => setBase64Preview(null)}
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="size-8" />
                  <span className="text-sm font-medium">Toque para escolher a imagem</span>
                </button>
              )}
            </div>

            {/* Título */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-titulo">Título da promoção (opcional)</Label>
              <Input
                id="banner-titulo"
                placeholder="Ex: Combo do Dia"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="h-11 text-base"
              />
            </div>

            {/* Itens */}
            <div className="flex flex-col gap-2">
              <Label>Itens da promoção (opcional)</Label>

              {itensSelecionados.length > 0 && (
                <ul className="flex flex-col gap-1 mb-1">
                  {itensSelecionados.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
                      <span className="flex-1 text-sm font-medium">{item.nome}</span>
                      <span className="text-sm text-muted-foreground">R$ {item.preco}</span>
                      <button type="button" onClick={() => removerItemLista(idx)} className="ml-1 text-muted-foreground hover:text-destructive">
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => setMostraModal(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="size-4" />
                Adicionar item
              </button>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={enviar} disabled={!base64Preview || pending} className="h-12 sm:h-9 flex-1 text-base sm:text-sm">
                {pending ? "Salvando…" : "Salvar banner"}
              </Button>
              <Button variant="outline" onClick={cancelar} disabled={pending} className="h-12 sm:h-9 text-base sm:text-sm">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {banners.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum banner cadastrado ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {banners.map((b) => (
              <div key={b.id} className="relative overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imagemUrl} alt="" className="mx-auto block h-auto max-h-72 w-auto max-w-full" />
                {(b.titulo || b.itens.length > 0) && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                    {b.titulo && <p className="text-white font-semibold text-sm">{b.titulo}</p>}
                    {b.itens.length > 0 && (
                      <p className="text-white/90 text-xs">
                        {b.itens.map((i) => `${i.nome} ${formatPreco(i.precoPromocional)}`).join(" + ")}
                      </p>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => deletar(b.id)}
                  className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
                  aria-label="Remover banner"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
