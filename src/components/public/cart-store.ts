"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  cardapioDiaId: string;
  nome: string;
  categoria: string;
  preco: string;
  precoFormatado: string;
  quantidade: number;
  disponivelReal: number;
};

export const CART_STORAGE_KEY = "marmita-pay-cart";

const EMPTY_CART: CartItem[] = [];
let cartSnapshot: CartItem[] | null = null;

export function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);

  if (!rawCart) {
    return [];
  }

  try {
    return JSON.parse(rawCart) as CartItem[];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  cartSnapshot = items;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:updated"));
}

function getCartSnapshot(): CartItem[] {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  if (cartSnapshot === null) {
    cartSnapshot = readCart();
  }

  return cartSnapshot;
}

function getServerCartSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function subscribeCart(callback: () => void): () => void {
  window.addEventListener("cart:updated", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("cart:updated", callback);
    window.removeEventListener("storage", callback);
  };
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
