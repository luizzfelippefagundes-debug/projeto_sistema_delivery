"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useTransition } from "react";
import { adicionarBanner, removerBanner } from "@/actions/cardapio.actions";
import { Button } from "@/components/ui/button";

interface Banner {
  id: string;
  imagemUrl: string;
  linkUrl: string | null;
  ordem: number;
}

export default function BannersManager({ banners }: { banners: Banner[] }) {
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      startTransition(() => adicionarBanner(base64));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function deletar(id: string) {
    startTransition(() => removerBanner(id));
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Banners aparecem no topo do cardápio como um carousel. Recomendado: imagem horizontal (16:9 ou similar), até 2 MB.
      </p>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="gap-2"
        >
          <ImagePlus className="size-4" />
          {pending ? "Enviando…" : "Adicionar banner"}
        </Button>
      </div>

      {banners.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum banner cadastrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((b) => (
            <div key={b.id} className="relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.imagemUrl} alt="" className="aspect-[16/5] w-full object-cover" />
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
