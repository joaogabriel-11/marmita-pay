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
        <section key={categoria} className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">{categoria}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {itens
              .filter((item) => item.categoria === categoria)
              .map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {item.fotoUrl ? (
                    <div
                      role="img"
                      aria-label={item.nome}
                      className="h-44 w-full bg-zinc-100"
                      style={{
                        backgroundImage: `url(${item.fotoUrl})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }}
                    />
                  ) : (
                    <div className="grid h-44 place-items-center bg-zinc-100 text-sm text-zinc-400">
                      Sem foto
                    </div>
                  )}
                  <div className="flex min-h-48 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-1 text-base font-semibold text-zinc-950">
                          {item.nome}
                        </h3>
                        {item.destaque ? (
                          <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            Destaque
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-600">
                        {item.descricao}
                      </p>
                      <div className="mt-3 inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                        {item.esgotado
                          ? "Esgotado"
                          : `${item.disponivelReal} disponíveis`}
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-xl font-bold text-zinc-950">
                        {item.precoFormatado}
                      </span>
                      <button
                        type="button"
                        disabled={!aberto || item.esgotado}
                        onClick={() => adicionarItem(item)}
                        className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
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
