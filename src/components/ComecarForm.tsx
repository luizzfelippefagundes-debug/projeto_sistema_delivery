"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { criarRestauranteEDono } from "@/actions/onboarding.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ComecarForm({ nomeSugerido }: { nomeSugerido: string }) {
  const router = useRouter();
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [nomeDono, setNomeDono] = useState(nomeSugerido);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function salvar() {
    if (!nomeRestaurante.trim() || !nomeDono.trim()) {
      setErro("Preencha os dois campos.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        await criarRestauranteEDono({ nomeRestaurante, nomeDono });
        router.push("/dono");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra criar o restaurante.");
      }
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="mb-1 text-2xl leading-none">🍣</div>
        <CardTitle className="font-heading text-xl">Vamos criar seu restaurante</CardTitle>
        <p className="text-sm text-muted-foreground">Leva menos de um minuto. Você já entra como dono(a) do seu próprio painel.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome-restaurante">Nome do restaurante</Label>
          <Input
            id="nome-restaurante"
            value={nomeRestaurante}
            onChange={(e) => setNomeRestaurante(e.target.value)}
            placeholder="Ex: Dashi Sushi"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome-dono">Seu nome</Label>
          <Input id="nome-dono" value={nomeDono} onChange={(e) => setNomeDono(e.target.value)} placeholder="Ex: Darlane" />
        </div>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <Button disabled={pending} onClick={salvar} className="w-full">
          {pending ? "Criando…" : "Criar meu restaurante"}
        </Button>
      </CardContent>
    </Card>
  );
}
