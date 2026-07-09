"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

type Step = {
  status: string;
  label: string;
};

const terminalStatuses = new Set([
  "EXPIRADO",
  "CANCELADO",
  "ENTREGUE",
  "RETIRADO",
]);

const pickupSteps: Step[] = [
  { status: "CONFIRMADO", label: "Confirmado" },
  { status: "EM_PREPARO", label: "Preparando" },
  { status: "PRONTO_PARA_RETIRADA", label: "Retirada" },
  { status: "RETIRADO", label: "Finalizado" },
];

const deliverySteps: Step[] = [
  { status: "CONFIRMADO", label: "Confirmado" },
  { status: "EM_PREPARO", label: "Preparando" },
  { status: "SAIU_PARA_ENTREGA", label: "Entrega" },
  { status: "ENTREGUE", label: "Finalizado" },
];

const statusTitles: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  CONFIRMADO: "Pedido confirmado",
  EM_PREPARO: "Em preparação",
  PRONTO_PARA_RETIRADA: "Pronto para retirada",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Finalizado",
  RETIRADO: "Finalizado",
  EXPIRADO: "Pedido expirado",
  CANCELADO: "Pedido cancelado",
};

const statusDescriptions: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Finalize o Pix para o restaurante receber seu pedido.",
  CONFIRMADO: "Tudo certo. O restaurante já recebeu seu pedido.",
  EM_PREPARO: "A cozinha está preparando seus itens.",
  PRONTO_PARA_RETIRADA: "Pode ir retirar seu pedido no restaurante.",
  SAIU_PARA_ENTREGA: "Seu pedido está a caminho.",
  ENTREGUE: "Pedido entregue. Obrigado pela compra.",
  RETIRADO: "Pedido retirado. Obrigado pela compra.",
  EXPIRADO: "O prazo para pagamento acabou.",
  CANCELADO: "Esse pedido foi cancelado.",
};

const statusTheme: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "border-amber-200 bg-amber-50 text-amber-900",
  CONFIRMADO: "border-emerald-200 bg-emerald-50 text-emerald-900",
  EM_PREPARO: "border-blue-200 bg-blue-50 text-blue-900",
  PRONTO_PARA_RETIRADA: "border-cyan-200 bg-cyan-50 text-cyan-900",
  SAIU_PARA_ENTREGA: "border-cyan-200 bg-cyan-50 text-cyan-900",
  ENTREGUE: "border-zinc-200 bg-zinc-50 text-zinc-800",
  RETIRADO: "border-zinc-200 bg-zinc-50 text-zinc-800",
  EXPIRADO: "border-red-200 bg-red-50 text-red-900",
  CANCELADO: "border-red-200 bg-red-50 text-red-900",
};

const pagamentoLabels: Record<string, string> = {
  PENDENTE: "Aguardando pagamento",
  APROVADO: "Pago",
  RECUSADO: "Pagamento recusado",
  ESTORNADO: "Estornado",
};

function sortStatuses(pedidos: PedidoStatus[]) {
  return [...pedidos].sort((a, b) => b.codigoPedido - a.codigoPedido);
}

function getStepsForStatus(status: string) {
  if (status === "SAIU_PARA_ENTREGA" || status === "ENTREGUE") {
    return deliverySteps;
  }

  return pickupSteps;
}

function getCurrentStepIndex(pedido: PedidoStatus, steps: Step[]) {
  if (pedido.status === "AGUARDANDO_PAGAMENTO") {
    return -1;
  }

  if (pedido.status === "CANCELADO" || pedido.status === "EXPIRADO") {
    return -1;
  }

  const index = steps.findIndex((step) => step.status === pedido.status);
  return index >= 0 ? index : 0;
}

function getStatusTitle(status: string) {
  return statusTitles[status] ?? status;
}

function getPaymentLabel(status: string | null) {
  if (!status) {
    return "Não informado";
  }

  return pagamentoLabels[status] ?? status;
}

export function OrdersClient() {
  const storedOrders = useStoredOrders();
  const codigos = useMemo(
    () => storedOrders.map((order) => order.codigoPedido),
    [storedOrders],
  );
  const [pedidos, setPedidos] = useState<PedidoStatus[]>([]);
  const pedidosRef = useRef<PedidoStatus[]>([]);

  useEffect(() => {
    if (codigos.length === 0) {
      pedidosRef.current = [];
      return;
    }

    let isActive = true;

    async function buscarPedido(codigoPedido: number, shouldSync: boolean) {
      const response = await fetch(
        `/api/pedidos/${codigoPedido}/status${shouldSync ? "?sync=1" : ""}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as PedidoStatus;
    }

    function atualizarPedidos(nextPedidos: PedidoStatus[]) {
      const pedidosOrdenados = sortStatuses(nextPedidos);
      pedidosRef.current = pedidosOrdenados;
      setPedidos(pedidosOrdenados);
    }

    async function carregarPedidosIniciais() {
      const responses = await Promise.all(
        codigos.map((codigoPedido) => buscarPedido(codigoPedido, true)),
      );

      if (!isActive) {
        return;
      }

      atualizarPedidos(responses.filter(Boolean) as PedidoStatus[]);
    }

    async function sincronizarPedidosAtivos() {
      const pedidosAtivos = pedidosRef.current.filter(
        (pedido) => !terminalStatuses.has(pedido.status),
      );

      if (pedidosAtivos.length === 0) {
        return;
      }

      const responses = await Promise.all(
        pedidosAtivos.map((pedido) =>
          buscarPedido(
            pedido.codigoPedido,
            pedido.status === "AGUARDANDO_PAGAMENTO",
          ),
        ),
      );

      if (!isActive) {
        return;
      }

      const pedidosAtualizados = responses.filter(Boolean) as PedidoStatus[];
      const pedidosPorCodigo = new Map(
        pedidosAtualizados.map((pedido) => [pedido.codigoPedido, pedido]),
      );

      atualizarPedidos(
        pedidosRef.current.map(
          (pedido) => pedidosPorCodigo.get(pedido.codigoPedido) ?? pedido,
        ),
      );
    }

    carregarPedidosIniciais();

    const intervalId = window.setInterval(() => {
      sincronizarPedidosAtivos();
    }, 6000);

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
          Acompanhe o preparo e a entrega dos seus pedidos.
        </p>
      </div>

      <div className="grid gap-4">
        {pedidos.map((pedido) => {
          const steps = getStepsForStatus(pedido.status);
          const currentStepIndex = getCurrentStepIndex(pedido, steps);
          const isPaymentPending = pedido.pagamentoStatus === "PENDENTE";
          const isTerminal = terminalStatuses.has(pedido.status);

          return (
            <article
              key={pedido.codigoPedido}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-500">
                    Pedido #{pedido.codigoPedido}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {getStatusTitle(pedido.status)}
                  </h2>
                </div>
                <span className="text-sm font-semibold">
                  {pedido.valorTotalFormatado}
                </span>
              </div>

              <div
                className={`mt-4 rounded-lg border px-4 py-3 ${
                  statusTheme[pedido.status] ??
                  "border-zinc-200 bg-zinc-50 text-zinc-800"
                }`}
              >
                <p className="text-sm font-medium">
                  {statusDescriptions[pedido.status] ?? pedido.statusLabel}
                </p>
              </div>

              {pedido.status === "AGUARDANDO_PAGAMENTO" ||
              pedido.status === "CANCELADO" ||
              pedido.status === "EXPIRADO" ? null : (
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {steps.map((step, index) => {
                    const isDone = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div key={step.status} className="min-w-0">
                        <div
                          className={`h-2 rounded-full ${
                            isDone ? "bg-zinc-950" : "bg-zinc-200"
                          }`}
                        />
                        <p
                          className={`mt-2 truncate text-xs ${
                            isCurrent
                              ? "font-semibold text-zinc-950"
                              : isDone
                                ? "text-zinc-700"
                                : "text-zinc-400"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
                <p className="text-xs text-zinc-500">
                  Pagamento: {getPaymentLabel(pedido.pagamentoStatus)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {isPaymentPending ? (
                    <Link
                      href={`/pedido/${pedido.codigoPedido}`}
                      className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
                    >
                      Ver detalhes
                    </Link>
                  ) : null}
                  {isTerminal ? (
                    <button
                      type="button"
                      onClick={() => removeStoredOrder(pedido.codigoPedido)}
                      className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
                    >
                      Remover da lista
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
