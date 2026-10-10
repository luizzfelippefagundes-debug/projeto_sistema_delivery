"use client";

import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { adicionarBanner, removerBanner } from "@/actions/cardapio.actions";
import { Button } from "@/components/ui/button";
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

export default function BannersManager({
  banners,
  itensCardapio,
}: {
  banners: Banner[];
  itensCardapio: ItemCardapio[];
}) {
  const [pending, startTransition] = useTransition();
  const [mostraForm, setMostraForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [itensSelecionados, setItensSelecionados] = useState<{ nome: string; preco: string }[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState("");
  const [precoItem, setPrecoItem] = useState("");
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

  function adicionarItem() {
    const nome = itemSelecionado.trim();
    const preco = precoItem.trim();
    if (!nome || !preco) return;
    setItensSelecionados((prev) => [...prev, { nome, preco }]);
    setItemSelecionado("");
    setPrecoItem("");
  }

  function removerItemLista(idx: number) {
    setItensSelecionados((prev) => prev.filter((_, i) => i !== idx));
  }

  function cancelar() {
    setMostraForm(false);
    setTitulo("");
    setItensSelecionados([]);
    setItemSelecionado("");
    setPrecoItem("");
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

  // Format price for display
  function formatPreco(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Banners aparecem no topo do cardápio como um carousel. Recomendado: imagem horizontal (16:9 ou similar), até 2 MB.
      </p>

      {!mostraForm ? (
        <Button onClick={() => setMostraForm(true)} className="w-fit gap-2">
          <ImagePlus className="size-4" />
          Novo banner
        </Button>
      ) : (
        <div className="rounded-xl border border-border p-4 flex flex-col gap-4 bg-card">
          <p className="font-medium text-sm">Novo banner</p>

          {/* Foto */}
          <div className="flex flex-col gap-1.5">
            <Label>Foto do banner</Label>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            {base64Preview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={base64Preview} alt="Preview" className="aspect-[16/5] w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setBase64Preview(null); }}
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <Button variant="outline" type="button" onClick={() => inputRef.current?.click()} className="w-fit gap-2">
                <ImagePlus className="size-4" />
                Escolher imagem
              </Button>
            )}
          </div>

          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="banner-titulo">Título da promoção (opcional)</Label>
            <Input
              id="banner-titulo"
              placeholder="Ex: Combo do Dia"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Itens */}
          <div className="flex flex-col gap-2">
            <Label>Itens da promoção (opcional)</Label>
            <div className="flex gap-2 flex-wrap">
              <select
                value={itemSelecionado}
                onChange={(e) => {
                  const nome = e.target.value;
                  setItemSelecionado(nome);
                  const item = itensCardapio.find((i) => i.nome === nome);
                  if (item) setPrecoItem(item.preco.toFixed(2).replace(".", ","));
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm flex-1 min-w-0"
              >
                <option value="">Selecionar item…</option>
                {Object.entries(
                  itensCardapio.reduce<Record<string, ItemCardapio[]>>((acc, i) => {
                    (acc[i.categoria] ??= []).push(i);
                    return acc;
                  }, {}),
                ).map(([cat, items]) => (
                  <optgroup key={cat} label={cat}>
                    {items.map((i) => (
                      <option key={i.id} value={i.nome}>{i.nome}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <Input
                placeholder="Preço promo (R$)"
                value={precoItem}
                onChange={(e) => setPrecoItem(e.target.value)}
                className="w-32"
              />
              <Button type="button" variant="outline" size="icon" onClick={adicionarItem} disabled={!itemSelecionado || !precoItem}>
                <Plus className="size-4" />
              </Button>
            </div>

            {itensSelecionados.length > 0 && (
              <ul className="flex flex-col gap-1">
                {itensSelecionados.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">{item.nome}</span>
                    <span className="text-muted-foreground">R$ {item.preco}</span>
                    <button type="button" onClick={() => removerItemLista(idx)} className="text-destructive hover:opacity-70">
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={enviar} disabled={!base64Preview || pending}>
              {pending ? "Salvando…" : "Salvar banner"}
            </Button>
            <Button variant="ghost" onClick={cancelar} disabled={pending}>
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
              <img src={b.imagemUrl} alt="" className="aspect-[16/5] w-full object-cover" />
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
                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
                aria-label="Remover banner"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
