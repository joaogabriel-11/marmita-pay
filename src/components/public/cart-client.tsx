"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatCurrency, useCart, writeCart } from "./cart-store";

export function CartClient() {
  const items = useCart();

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.preco) * item.quantidade,
        0,
      ),
    [items],
  );

  function updateQuantity(cardapioDiaId: string, quantidade: number) {
    const nextItems = items
      .map((item) =>
        item.cardapioDiaId === cardapioDiaId
          ? {
              ...item,
              quantidade: Math.min(Math.max(quantidade, 1), item.disponivelReal),
            }
          : item,
      )
      .filter((item) => item.quantidade > 0);

    writeCart(nextItems);
  }

  function removeItem(cardapioDiaId: string) {
    const nextItems = items.filter(
      (item) => item.cardapioDiaId !== cardapioDiaId,
    );
    writeCart(nextItems);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold">Seu carrinho esta vazio</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Escolha uma marmita no cardapio para continuar.
        </p>
        <Link
          href="/cardapio"
          className="mt-4 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
          Ver cardapio
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Carrinho</h1>
        {items.map((item) => (
          <article
            key={item.cardapioDiaId}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{item.nome}</h2>
                <p className="text-sm text-zinc-500">{item.categoria}</p>
                <p className="mt-2 text-sm font-medium">
                  {item.precoFormatado}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.cardapioDiaId)}
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
              >
                Remover
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.cardapioDiaId, item.quantidade - 1)
                }
                className="h-9 w-9 rounded-md border border-zinc-200"
              >
                -
              </button>
              <span className="flex h-9 w-12 items-center justify-center rounded-md border border-zinc-200 text-sm font-medium">
                {item.quantidade}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.cardapioDiaId, item.quantidade + 1)
                }
                className="h-9 w-9 rounded-md border border-zinc-200"
              >
                +
              </button>
            </div>
          </article>
        ))}
      </section>

      <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Resumo</h2>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>Subtotal</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <Link
          href="/checkout"
          className="mt-4 flex w-full justify-center rounded-md bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
        >
          Ir para checkout
        </Link>
      </aside>
    </div>
  );
}
