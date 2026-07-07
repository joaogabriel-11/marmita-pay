"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatCurrency,
  useCart,
  writeCart,
} from "./cart-store";

type ZonaEntregaOption = {
  id: string;
  nome: string;
  taxaEntrega: string;
  taxaEntregaFormatada: string;
};

type CheckoutActionState =
  | {
      success: false;
      message: string | null;
    }
  | {
      success: true;
      codigoPedido: number;
    };

type CheckoutClientProps = {
  zonasEntrega: ZonaEntregaOption[];
  action: (
    state: CheckoutActionState,
    formData: FormData,
  ) => Promise<CheckoutActionState>;
  initialState: CheckoutActionState;
};

export function CheckoutClient({
  zonasEntrega,
  action,
  initialState,
}: CheckoutClientProps) {
  const router = useRouter();
  const items = useCart();
  const [state, formAction, isPending] = useActionState(action, initialState);
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
  const itensJson = useMemo(
    () =>
      JSON.stringify(
        items.map((item) => ({
          cardapioDiaId: item.cardapioDiaId,
          quantidade: item.quantidade,
        })),
      ),
    [items],
  );

  useEffect(() => {
    if (!state.success) {
      return;
    }

    writeCart([]);
    router.push(`/pedido/${state.codigoPedido}`);
  }, [router, state]);

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
      <form
        action={formAction}
        className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <input type="hidden" name="itens" value={itensJson} />
        <input type="hidden" name="tipoEntrega" value={tipoEntrega} />

        <div>
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Informe seus dados para preparar o pagamento Pix.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Nome</span>
            <input
              name="clienteNome"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">WhatsApp</span>
            <input
              name="clienteTelefone"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Email opcional</span>
            <input
              name="clienteEmail"
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
              <input
                name="enderecoRua"
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Numero</span>
              <input
                name="enderecoNumero"
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Bairro</span>
              <input
                name="enderecoBairro"
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Complemento</span>
              <input
                name="enderecoComplemento"
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Zona de entrega</span>
              <select
                name="zonaEntregaId"
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              >
                <option value="">Selecione uma zona</option>
                {zonasEntrega.map((zona) => (
                  <option key={zona.id} value={zona.id}>
                    {zona.nome} - {zona.taxaEntregaFormatada}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {!state.success && state.message ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isPending ? "Gerando Pix..." : "Gerar Pix"}
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
