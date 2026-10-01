"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface EscolhaCombo {
  nome: string;
  quantidade: number;
}

export interface CartItem {
  cartItemId: string;
  itemCardapioId: string;
  nome: string;
  preco: number;
  qtd: number;
  /** Só presente pra combos com peças escolhidas — cada combinação diferente
   * vira uma linha própria na sacola, nunca agrupada com outra. */
  escolhas?: EscolhaCombo[];
}

const STORAGE_PREFIX = "cart-v2";

/** A sacola é guardada por restaurante (via slug na URL) — sem isso, um
 * cliente que visita duas lojas diferentes nesse SaaS no mesmo navegador
 * veria a sacola de uma loja misturada com a da outra. */
function chaveStorage(pathname: string): string {
  const slug = /^\/loja\/([^/]+)/.exec(pathname)?.[1];
  return `${STORAGE_PREFIX}:${slug ?? "geral"}`;
}

function gerarId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

interface CartValue {
  items: CartItem[];
  total: number;
  count: number;
  add: (itemCardapioId: string, nome: string, preco: number, qtd?: number) => void;
  addComEscolhas: (itemCardapioId: string, nome: string, preco: number, escolhas: EscolhaCombo[], qtd?: number) => void;
  atualizarEscolhas: (cartItemId: string, escolhas: EscolhaCombo[]) => void;
  setQty: (cartItemId: string, qtd: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const storageKey = chaveStorage(pathname);
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    try {
      const raw = localStorage.getItem(storageKey);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // storage unavailable, cart still works in-memory
    }
  }, [items, ready, storageKey]);

  const add = useCallback((itemCardapioId: string, nome: string, preco: number, qtd = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemCardapioId === itemCardapioId && !i.escolhas);
      if (existing) return prev.map((i) => (i === existing ? { ...i, qtd: i.qtd + qtd } : i));
      return [...prev, { cartItemId: gerarId(), itemCardapioId, nome, preco, qtd }];
    });
  }, []);

  const addComEscolhas = useCallback(
    (itemCardapioId: string, nome: string, preco: number, escolhas: EscolhaCombo[], qtd = 1) => {
      setItems((prev) => [...prev, { cartItemId: gerarId(), itemCardapioId, nome, preco, qtd, escolhas }]);
    },
    [],
  );

  const atualizarEscolhas = useCallback((cartItemId: string, escolhas: EscolhaCombo[]) => {
    setItems((prev) => prev.map((i) => (i.cartItemId === cartItemId ? { ...i, escolhas } : i)));
  }, []);

  const setQty = useCallback((cartItemId: string, qtd: number) => {
    setItems((prev) => {
      if (qtd <= 0) return prev.filter((i) => i.cartItemId !== cartItemId);
      return prev.map((i) => (i.cartItemId === cartItemId ? { ...i, qtd } : i));
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + i.preco * i.qtd, 0);
  const count = items.reduce((s, i) => s + i.qtd, 0);

  return (
    <CartContext.Provider value={{ items, total, count, add, addComEscolhas, atualizarEscolhas, setQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
