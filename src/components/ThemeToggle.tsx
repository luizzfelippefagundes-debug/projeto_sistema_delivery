"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  const escuro = montado && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      onClick={() => setTheme(escuro ? "light" : "dark")}
      aria-label={escuro ? "Mudar pro tema claro" : "Mudar pro tema escuro"}
    >
      {escuro ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  );
}
