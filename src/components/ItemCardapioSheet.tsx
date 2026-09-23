"use client";

import { ImageOff, Plus, Upload, X } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
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
  opcoesAtuais,
  open,
  onOpenChange,
}: {
  categorias: string[];
  item: ItemCardapio | null;
  opcoesAtuais: string[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [controlarEstoque, setControlarEstoque] = useState(false);
  const [estoqueAtual, setEstoqueAtual] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("5");
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [ehCombo, setEhCombo] = useState(false);
  const [qtdPecas, setQtdPecas] = useState("");
  const [opcoes, setOpcoes] = useState<string[]>([]);
  const [novaOpcao, setNovaOpcao] = useState("");
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
    setControlarEstoque(item?.estoqueAtual != null);
    setEstoqueAtual(item?.estoqueAtual != null ? String(item.estoqueAtual) : "");
    setEstoqueMinimo(item?.estoqueMinimo != null ? String(item.estoqueMinimo) : "5");
    setEhCombo(item?.qtdPecasEscolha != null);
    setQtdPecas(item?.qtdPecasEscolha != null ? String(item.qtdPecasEscolha) : "");
    setOpcoes(opcoesAtuais);
    setNovaOpcao("");
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  function adicionarOpcao() {
    const nomeLimpo = novaOpcao.trim();
    if (!nomeLimpo) return;
    setOpcoes((prev) => [...prev, nomeLimpo]);
    setNovaOpcao("");
  }

  function removerOpcao(idx: number) {
    setOpcoes((prev) => prev.filter((_, i) => i !== idx));
  }

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
    const estoqueAtualNumero = controlarEstoque ? Number(estoqueAtual || "0") : null;
    const estoqueMinimoNumero = controlarEstoque ? Number(estoqueMinimo || "0") : null;
    if (controlarEstoque && (Number.isNaN(estoqueAtualNumero) || estoqueAtualNumero! < 0)) {
      setErro("Informe uma quantidade de estoque válida.");
      return;
    }
    const qtdPecasNumero = ehCombo ? Number(qtdPecas || "0") : null;
    if (ehCombo && (Number.isNaN(qtdPecasNumero) || qtdPecasNumero! <= 0)) {
      setErro("Informe a quantidade de peças do combo.");
      return;
    }
    if (ehCombo && opcoes.length < 2) {
      setErro("Adicione pelo menos 2 opções de peça pro cliente escolher.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        const payload = {
          nome,
          categoria: categoriaFinal,
          descricao,
          preco: precoNumero,
          imagemUrl,
          estoqueAtual: estoqueAtualNumero,
          estoqueMinimo: estoqueMinimoNumero,
          qtdPecasEscolha: qtdPecasNumero,
          opcoes,
        };
        if (item) {
          await atualizarItemCardapio(item.id, payload);
        } else {
          await criarItemCardapio(payload);
        }
        onOpenChange(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra salvar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="p-4">
          <DialogTitle>{item ? "Editar item" : "Novo item do cardápio"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
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

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="controlar-estoque">Controlar estoque</Label>
              <Switch id="controlar-estoque" checked={controlarEstoque} onCheckedChange={setControlarEstoque} />
            </div>
            <p className="text-xs text-muted-foreground">
              Pra itens com unidade contável (bebidas, por exemplo). Cada venda desconta daqui e o item pausa sozinho ao zerar.
            </p>
            {controlarEstoque && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="estoque-atual">Quantidade em estoque</Label>
                  <Input
                    id="estoque-atual"
                    value={estoqueAtual}
                    onChange={(e) => setEstoqueAtual(e.target.value)}
                    inputMode="numeric"
                    placeholder="Ex: 24"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="estoque-minimo">Avisar abaixo de</Label>
                  <Input
                    id="estoque-minimo"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(e.target.value)}
                    inputMode="numeric"
                    placeholder="Ex: 5"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="eh-combo">Combo com escolha de peças</Label>
              <Switch id="eh-combo" checked={ehCombo} onCheckedChange={setEhCombo} />
            </div>
            <p className="text-xs text-muted-foreground">
              O cliente escolhe as peças (até bater a quantidade abaixo) antes de adicionar na sacola.
            </p>
            {ehCombo && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="qtd-pecas">Quantidade de peças do combo</Label>
                  <Input
                    id="qtd-pecas"
                    value={qtdPecas}
                    onChange={(e) => setQtdPecas(e.target.value)}
                    inputMode="numeric"
                    placeholder="Ex: 10"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Peças escolhíveis</Label>
                  <div className="flex flex-col gap-1.5">
                    {opcoes.map((o, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
                        <span className="flex-1">{o}</span>
                        <button
                          type="button"
                          onClick={() => removerOpcao(idx)}
                          aria-label={`Remover ${o}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {opcoes.length === 0 && (
                      <p className="text-xs text-muted-foreground">Nenhuma peça adicionada ainda.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={novaOpcao}
                      onChange={(e) => setNovaOpcao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          adicionarOpcao();
                        }
                      }}
                      placeholder="Ex: Hot Filadélfia"
                    />
                    <Button type="button" variant="outline" onClick={adicionarOpcao}>
                      <Plus /> Adicionar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
        <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
          <Button disabled={pending || processandoImagem} onClick={salvar}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
