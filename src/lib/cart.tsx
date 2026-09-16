"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface CartItem {
  itemCardapioId: string;
  nome: string;
  preco: number;
  qtd: number;
}

const STORAGE_KEY = "dashi-sushi-cart-v1";

interface CartValue {
  items: CartItem[];
  total: number;
  count: number;
  add: (itemCardapioId: string, nome: string, preco: number) => void;
  setQty: (itemCardapioId: string, qtd: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore, start with empty cart
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable, cart still works in-memory
    }
  }, [items, ready]);

  const add = useCallback((itemCardapioId: string, nome: string, preco: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemCardapioId === itemCardapioId);
      if (existing) return prev.map((i) => (i.itemCardapioId === itemCardapioId ? { ...i, qtd: i.qtd + 1 } : i));
      return [...prev, { itemCardapioId, nome, preco, qtd: 1 }];
    });
  }, []);

  const setQty = useCallback((itemCardapioId: string, qtd: number) => {
    setItems((prev) => {
      if (qtd <= 0) return prev.filter((i) => i.itemCardapioId !== itemCardapioId);
      return prev.map((i) => (i.itemCardapioId === itemCardapioId ? { ...i, qtd } : i));
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + i.preco * i.qtd, 0);
  const count = items.reduce((s, i) => s + i.qtd, 0);

  return (
    <CartContext.Provider value={{ items, total, count, add, setQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
