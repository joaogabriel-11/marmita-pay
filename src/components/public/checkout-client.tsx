"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency, useCart } from "./cart-store";

export function CheckoutClient() {
  const items = useCart();
  const [tipoEntrega, setTipoEntrega] = useState<"DELIVERY" | "RETIRADA">(
    "RETIRADA",
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.preco) * item.quantidade,
        0,
      ),
    [items],
  );

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold">Nada para finalizar</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Seu carrinho esta vazio no momento.
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
      <form className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div>
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Informe seus dados para preparar o pagamento Pix.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Nome</span>
            <input className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">WhatsApp</span>
            <input className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Email opcional</span>
            <input
              type="email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Modalidade</span>
          <div className="grid grid-cols-2 gap-2">
            {(["RETIRADA", "DELIVERY"] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setTipoEntrega(tipo)}
                className={`rounded-md border px-3 py-2 text-sm font-medium ${
                  tipoEntrega === tipo
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-300 bg-white text-zinc-800"
                }`}
              >
                {tipo === "RETIRADA" ? "Retirada" : "Entrega"}
              </button>
            ))}
          </div>
        </div>

        {tipoEntrega === "DELIVERY" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Rua</span>
              <input className="w-full rounded-md border border-zinc-300 px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Numero</span>
              <input className="w-full rounded-md border border-zinc-300 px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Bairro</span>
              <input className="w-full rounded-md border border-zinc-300 px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Complemento</span>
              <input className="w-full rounded-md border border-zinc-300 px-3 py-2" />
            </label>
          </div>
        ) : null}

        <button
          type="button"
          className="w-full rounded-md bg-zinc-400 px-4 py-3 text-sm font-medium text-white"
        >
          Pagamento Pix em breve
        </button>
      </form>

      <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Pedido</h2>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.cardapioDiaId}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span>
                {item.quantidade}x {item.nome}
              </span>
              <strong>{formatCurrency(Number(item.preco) * item.quantidade)}</strong>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
