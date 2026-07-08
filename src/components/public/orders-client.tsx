"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  removeStoredOrder,
  useStoredOrders,
} from "@/components/public/orders-store";

type PedidoStatus = {
  codigoPedido: number;
  status: string;
  statusLabel: string;
  pagamentoStatus: string | null;
  valorTotalFormatado: string;
};

const terminalStatuses = new Set([
  "EXPIRADO",
  "CANCELADO",
  "ENTREGUE",
  "RETIRADO",
]);

const statusDescriptions: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando confirmação do Pix.",
  CONFIRMADO: "Pedido confirmado. A cozinha já recebeu.",
  EM_PREPARO: "Seu pedido está em preparação.",
  PRONTO_PARA_RETIRADA: "Seu pedido já pode ser retirado.",
  SAIU_PARA_ENTREGA: "Seu pedido saiu para entrega.",
  ENTREGUE: "Pedido finalizado.",
  RETIRADO: "Pedido finalizado.",
  EXPIRADO: "O prazo de pagamento expirou.",
  CANCELADO: "Pedido cancelado.",
};

const statusClasses: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "bg-amber-50 text-amber-800 ring-amber-200",
  CONFIRMADO: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  EM_PREPARO: "bg-blue-50 text-blue-800 ring-blue-200",
  PRONTO_PARA_RETIRADA: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  SAIU_PARA_ENTREGA: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  ENTREGUE: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  RETIRADO: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  EXPIRADO: "bg-red-50 text-red-800 ring-red-200",
  CANCELADO: "bg-red-50 text-red-800 ring-red-200",
};

const pagamentoLabels: Record<string, string> = {
  PENDENTE: "Aguardando",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  ESTORNADO: "Estornado",
};

function sortStatuses(pedidos: PedidoStatus[]) {
  return [...pedidos].sort((a, b) => b.codigoPedido - a.codigoPedido);
}

function getStatusDisplayLabel(pedido: PedidoStatus) {
  if (pedido.status === "ENTREGUE" || pedido.status === "RETIRADO") {
    return "Finalizado";
  }

  return pedido.statusLabel;
}

export function OrdersClient() {
  const storedOrders = useStoredOrders();
  const codigos = useMemo(
    () => storedOrders.map((order) => order.codigoPedido),
    [storedOrders],
  );
  const [pedidos, setPedidos] = useState<PedidoStatus[]>([]);

  useEffect(() => {
    if (codigos.length === 0) {
      return;
    }

    let isActive = true;

    async function carregarPedidos() {
      const responses = await Promise.all(
        codigos.map(async (codigoPedido) => {
          const response = await fetch(
            `/api/pedidos/${codigoPedido}/status?sync=1`,
            { cache: "no-store" },
          );

          if (!response.ok) {
            return null;
          }

          return (await response.json()) as PedidoStatus;
        }),
      );

      if (!isActive) {
        return;
      }

      setPedidos(sortStatuses(responses.filter(Boolean) as PedidoStatus[]));
    }

    carregarPedidos();

    const intervalId = window.setInterval(() => {
      carregarPedidos();
    }, 4000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [codigos]);

  if (codigos.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold">Nenhum pedido salvo</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Seus pedidos feitos aparecerão aqui.
        </p>
        <Link
          href="/cardapio"
          className="mt-4 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
          Ver cardápio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Acompanhe os pedidos feitos neste navegador.
        </p>
      </div>

      <div className="grid gap-3">
        {pedidos.map((pedido) => {
          const pagamentoLabel = pedido.pagamentoStatus
            ? pagamentoLabels[pedido.pagamentoStatus] ?? pedido.pagamentoStatus
            : "Não informado";

          return (
            <article
              key={pedido.codigoPedido}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-500">Pedido</p>
                  <h2 className="text-xl font-semibold">
                    #{pedido.codigoPedido}
                  </h2>
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${
                    statusClasses[pedido.status] ??
                    "bg-zinc-50 text-zinc-700 ring-zinc-200"
                  }`}
                >
                  {getStatusDisplayLabel(pedido)}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-700">
                {statusDescriptions[pedido.status] ?? pedido.statusLabel}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 text-sm">
                <span className="text-zinc-600">
                  Pagamento: <strong>{pagamentoLabel}</strong>
                </span>
                <span className="font-semibold">
                  {pedido.valorTotalFormatado}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/pedido/${pedido.codigoPedido}`}
                  className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
                >
                  Ver detalhes
                </Link>
                {terminalStatuses.has(pedido.status) ? (
                  <button
                    type="button"
                    onClick={() => removeStoredOrder(pedido.codigoPedido)}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
                  >
                    Remover da lista
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
