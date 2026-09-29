"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LinkAcesso {
  label: string;
  url: string;
}

function LinhaLink({ link }: { link: LinkAcesso }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível (ex: http sem HTTPS) — sem drama, ela copia manualmente
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{link.label}</p>
        <p className="truncate text-xs text-muted-foreground">{link.url}</p>
      </div>
      <Button size="sm" variant="outline" className="shrink-0" onClick={copiar}>
        {copiado ? <Check className="text-status-ok-fg" /> : <Copy />}
        {copiado ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}

/** Links prontos pra mandar pra cada funcionário entrar no painel certo, e
 * o link do cardápio digital pro cliente — pra ela mandar direto pelo
 * WhatsApp sem precisar do link "Sou da equipe" no site público. */
export default function LinksAcessoCard({ links }: { links: LinkAcesso[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Links de acesso</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          Manda o link certo pra cada pessoa entrar direto no painel dela, sem precisar procurar.
        </p>
        {links.map((link) => (
          <LinhaLink key={link.label} link={link} />
        ))}
      </CardContent>
    </Card>
  );
}
