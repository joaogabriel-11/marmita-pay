"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CardapioPublicoItem } from "@/lib/services/listar-cardapio-publico";
import { useCart, writeCart } from "./cart-store";

type MenuClientProps = {
  itens: CardapioPublicoItem[];
  aberto: boolean;
};

export function MenuClient({ itens, aberto }: MenuClientProps) {
  const cart = useCart();

  const quantidadeTotal = useMemo(
    () => cart.reduce((total, item) => total + item.quantidade, 0),
    [cart],
  );

  function adicionarItem(item: CardapioPublicoItem) {
    const nextCart = [...cart];
    const existente = nextCart.find(
      (cartItem) => cartItem.cardapioDiaId === item.id,
    );

    if (existente) {
      existente.quantidade = Math.min(
        existente.quantidade + 1,
        item.disponivelReal,
      );
    } else {
      nextCart.push({
        cardapioDiaId: item.id,
        nome: item.nome,
        categoria: item.categoria,
        preco: item.preco,
        precoFormatado: item.precoFormatado,
        quantidade: 1,
        disponivelReal: item.disponivelReal,
      });
    }

    writeCart(nextCart);
  }

  const categorias = Array.from(new Set(itens.map((item) => item.categoria)));

  return (
    <div className="space-y-6">
      {categorias.map((categoria) => (
        <section key={categoria} className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-800">{categoria}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {itens
              .filter((item) => item.categoria === categoria)
              .map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
                >
                  {item.fotoUrl ? (
                    <div
                      role="img"
                      aria-label={item.nome}
                      className="h-40 w-full object-cover"
                      style={{
                        backgroundImage: `url(${item.fotoUrl})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }}
                    />
                  ) : (
                    <div className="grid h-40 place-items-center bg-zinc-100 text-sm text-zinc-400">
                      Sem foto
                    </div>
                  )}
                  <div className="flex min-h-44 flex-col justify-between p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{item.nome}</h3>
                          <p className="mt-1 line-clamp-3 text-sm text-zinc-600">
                            {item.descricao}
                          </p>
                        </div>
                        {item.destaque ? (
                          <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                            Destaque
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-zinc-500">
                        {item.esgotado
                          ? "Esgotado"
                          : `${item.disponivelReal} disponiveis`}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="font-semibold">
                        {item.precoFormatado}
                      </span>
                      <button
                        type="button"
                        disabled={!aberto || item.esgotado}
                        onClick={() => adicionarItem(item)}
                        className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}

      {quantidadeTotal > 0 ? (
        <div className="sticky bottom-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">
              {quantidadeTotal} item(ns) no carrinho
            </span>
            <Link
              href="/carrinho"
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
            >
              Revisar
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
