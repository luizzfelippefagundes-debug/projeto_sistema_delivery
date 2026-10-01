"use client";

import { ImageOff, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { atualizarMarcaRestaurante, uploadLogoRestaurante } from "@/actions/marca.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const LADO_MAX_PX = 512;
const COR_PADRAO = "#e0362b";

/** Mesmo recorte/compressão de `processarImagem` em ItemCardapioSheet —
 * sempre quadrado, pra logo ficar consistente em qualquer lugar que
 * aparece (ícone do app, cabeçalho, favicon). */
function processarLogo(file: File): Promise<string> {
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
      resolve(canvas.toDataURL("image/png"));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("Não deu pra ler essa imagem."));
    img.src = URL.createObjectURL(file);
  });
}

export default function MarcaCard({
  logoAtual,
  corAtual,
}: {
  logoAtual: string | null;
  corAtual: string | null;
}) {
  const [logoUrl, setLogoUrl] = useState(logoAtual);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cor, setCor] = useState(corAtual ?? COR_PADRAO);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const logoExibida = logoPreview ?? logoUrl;

  async function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessando(true);
    setErro(null);
    try {
      setLogoPreview(await processarLogo(file));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu pra usar essa imagem.");
    } finally {
      setProcessando(false);
    }
  }

  function salvar() {
    setErro(null);
    startTransition(async () => {
      try {
        const logoFinal = logoPreview ? await uploadLogoRestaurante(logoPreview) : logoUrl;
        await atualizarMarcaRestaurante({ logoUrl: logoFinal, corPrimaria: cor });
        setLogoUrl(logoFinal);
        setLogoPreview(null);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra salvar.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Marca</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          Logo e cor usadas no painel, no cardápio do cliente e no ícone do app.
        </p>

        <div className="flex flex-col gap-1.5">
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {logoExibida ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoExibida} alt="" className="size-full object-contain" />
              ) : (
                <ImageOff className="size-6 text-muted-foreground" />
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={selecionarArquivo} />
            <Button type="button" variant="outline" size="sm" disabled={processando} onClick={() => inputRef.current?.click()}>
              <Upload /> {processando ? "Processando…" : "Trocar logo"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cor-primaria">Cor de destaque</Label>
          <div className="flex items-center gap-2">
            <input
              id="cor-primaria"
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
            />
            <span className="text-sm text-muted-foreground">{cor}</span>
          </div>
        </div>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <Button size="sm" className="self-start" disabled={pending || processando} onClick={salvar}>
          {pending ? "Salvando…" : "Salvar marca"}
        </Button>
      </CardContent>
    </Card>
  );
}
