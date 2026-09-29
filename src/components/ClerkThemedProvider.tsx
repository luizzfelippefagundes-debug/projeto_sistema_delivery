"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { dark } from "@clerk/ui/themes";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/** Troca o tema do Clerk (modais de login/cadastro, UserButton) junto com o
 * tema do site — sem isso, o texto ficava com uma cor fixa pensada pro modo
 * claro, ilegível em cima do fundo escuro do Clerk no modo escuro. Espera
 * montar no cliente antes de aplicar o tema escuro pra não flashar o tema
 * errado por causa do hidratação (next-themes só sabe o tema real depois de
 * montado). */
export default function ClerkThemedProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{
        theme: mounted && resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "#e0362b",
          fontFamily: "var(--font-body)",
          borderRadius: "8px",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
