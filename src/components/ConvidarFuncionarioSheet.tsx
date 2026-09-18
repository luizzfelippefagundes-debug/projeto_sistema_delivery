"use client";

import { useState, useTransition } from "react";
import { convidarFuncionario } from "@/actions/funcionarios.actions";
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

const PAPEIS = [
  { value: "atendente", label: "Atendente (comanda)" },
  { value: "cozinha", label: "Cozinha" },
  { value: "motoboy", label: "Motoboy" },
] as const;

export default function ConvidarFuncionarioSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<(typeof PAPEIS)[number]["value"]>("atendente");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (v) {
      setNome("");
      setEmail("");
      setPapel("atendente");
      setErro(null);
    }
  }

  function salvar() {
    if (!nome.trim() || !email.trim()) {
      setErro("Preencha nome e e-mail.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        await convidarFuncionario({ nome, emailConvite: email, papel });
        onOpenChange(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra convidar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="p-4">
          <DialogTitle>Convidar funcionário</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="func-nome">Nome</Label>
            <Input id="func-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Juliana" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="func-email">E-mail</Label>
            <Input
              id="func-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pessoa@email.com"
            />
            <p className="text-xs text-muted-foreground">
              A conta é ligada automaticamente quando essa pessoa entrar pela primeira vez com esse e-mail.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Papel</Label>
            <Select value={papel} onValueChange={(v) => v && setPapel(v as typeof papel)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAPEIS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
        <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
          <Button disabled={pending} onClick={salvar}>
            {pending ? "Convidando…" : "Convidar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
