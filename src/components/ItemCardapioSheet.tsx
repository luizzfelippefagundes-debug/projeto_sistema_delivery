"use client";

import { ImageOff, Upload } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { atualizarItemCardapio, criarItemCardapio } from "@/actions/cardapio.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { ItemCardapio } from "@/lib/types";

const NOVA_CATEGORIA = "__nova__";
const LADO_MAX_PX = 800;
const QUALIDADE_JPEG = 0.8;

/** Redimensiona e comprime a foto no navegador antes de mandar pro servidor
 * — evita fotos de câmera de celular (vários MB) inchando o banco. Sempre
 * recorta pro maior quadrado central, pra toda foto do cardápio ter a
 * mesma proporção na hora de exibir. */
function processarImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const lado = Math.min(img.width, img.height);
      const origemX = (img.width - lado) / 2;
      const origemY = (img.height - lado) / 2;
      const destino = Math.min(lado, LADO_MAX_PX);

      const canvas = document.createElement("canvas");
      canvas.width = destino;
      canvas.height = destino;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Não deu pra processar a imagem."));
      ctx.drawImage(img, origemX, origemY, lado, lado, 0, 0, destino, destino);
      resolve(canvas.toDataURL("image/jpeg", QUALIDADE_JPEG));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("Não deu pra ler essa imagem."));
    img.src = URL.createObjectURL(file);
  });
}

export default function ItemCardapioSheet({
  categorias,
  item,
  open,
  onOpenChange,
}: {
  categorias: string[];
  item: ItemCardapio | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [processandoImagem, setProcessandoImagem] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setNome(item?.nome ?? "");
    setCategoria(item?.categoria ?? categorias[0] ?? "");
    setNovaCategoria("");
    setDescricao(item?.descricao ?? "");
    setPreco(item ? String(item.preco) : "");
    setImagemUrl(item?.imagemUrl ?? null);
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  async function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessandoImagem(true);
    setErro(null);
    try {
      setImagemUrl(await processarImagem(file));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu pra usar essa imagem.");
    } finally {
      setProcessandoImagem(false);
    }
  }

  function salvar() {
    const categoriaFinal = categoria === NOVA_CATEGORIA ? novaCategoria.trim() : categoria;
    const precoNumero = Number(preco.replace(",", "."));
    if (!nome.trim() || !categoriaFinal || !precoNumero || precoNumero <= 0) {
      setErro("Preencha nome, categoria e um preço válido.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        if (item) {
          await atualizarItemCardapio(item.id, { nome, categoria: categoriaFinal, descricao, preco: precoNumero, imagemUrl });
        } else {
          await criarItemCardapio({ nome, categoria: categoriaFinal, descricao, preco: precoNumero, imagemUrl });
        }
        onOpenChange(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra salvar.");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{item ? "Editar item" : "Novo item do cardápio"}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label>Foto</Label>
            <div className="flex items-center gap-3">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-primary/10">
                {imagemUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagemUrl} alt="" className="size-full object-cover" />
                ) : (
                  <ImageOff className="size-6 text-primary/60" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={selecionarArquivo}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={processandoImagem}
                  onClick={() => inputArquivoRef.current?.click()}
                >
                  <Upload /> {processandoImagem ? "Processando…" : imagemUrl ? "Trocar foto" : "Adicionar foto"}
                </Button>
                {imagemUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setImagemUrl(null)}>
                    Remover foto
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-nome">Nome</Label>
            <Input id="item-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Combo 20 peças" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value={NOVA_CATEGORIA}>+ Nova categoria…</SelectItem>
              </SelectContent>
            </Select>
            {categoria === NOVA_CATEGORIA && (
              <Input
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Nome da nova categoria"
                className="mt-1"
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-descricao">Descrição (opcional)</Label>
            <Textarea
              id="item-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Salmão, cream cheese e cebolinha, 8 peças"
              maxLength={160}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-preco">Preço (R$)</Label>
            <Input id="item-preco" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="Ex: 82,00" inputMode="decimal" />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
        <SheetFooter>
          <Button disabled={pending || processandoImagem} onClick={salvar}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
