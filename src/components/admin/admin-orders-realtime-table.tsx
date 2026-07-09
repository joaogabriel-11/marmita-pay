"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import {
  createSupabaseBrowserClient,
  type SupabaseRealtimeChannel,
} from "@/lib/supabase/browser-client";

export type PedidoAdminRealtimeItem = {
  id: string;
  codigoPedido: number;
  clienteNome: string;
  clienteTelefone: string;
  status: string;
  tipoEntrega: "DELIVERY" | "RETIRADA";
  valorTotal: string;
  valorTotalFormatado: string;
  pagamentoStatus: string | null;
};

type FiltroPedidos =
  | "TODOS"
  | "EM_ANDAMENTO"
  | "AGUARDANDO_PAGAMENTO"
  | "EXPIRADOS"
  | "CANCELADOS"
  | "FINALIZADOS";

type AdminOrdersRealtimeTableProps = {
  initialPedidos: PedidoAdminRealtimeItem[];
  supabaseUrl: string;
  supabaseAnonKey: string;
  restauranteId?: string | null;
};

const pagamentoPeso: Record<string, number> = {
  APROVADO: 0,
  PENDENTE: 1,
  RECUSADO: 2,
  ESTORNADO: 2,
};

const proximosStatusBase: Record<string, string[]> = {
  AGUARDANDO_PAGAMENTO: ["CANCELADO"],
  CONFIRMADO: ["EM_PREPARO", "CANCELADO"],
  EM_PREPARO: ["PRONTO_PARA_RETIRADA", "SAIU_PARA_ENTREGA", "CANCELADO"],
  PRONTO_PARA_RETIRADA: ["RETIRADO"],
  SAIU_PARA_ENTREGA: ["ENTREGUE"],
  EXPIRADO: [],
  CANCELADO: [],
  ENTREGUE: [],
  RETIRADO: [],
};

const pagamentoLabels: Record<string, string> = {
  APROVADO: "Aprovado",
  PENDENTE: "Aguardando",
  RECUSADO: "Recusado",
  ESTORNADO: "Estornado",
};

const pagamentoClasses: Record<string, string> = {
  APROVADO: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PENDENTE: "bg-amber-50 text-amber-700 ring-amber-200",
  RECUSADO: "bg-red-50 text-red-700 ring-red-200",
  ESTORNADO: "bg-red-50 text-red-700 ring-red-200",
};

const statusPagamentoAprovado = new Set([
  "CONFIRMADO",
  "EM_PREPARO",
  "PRONTO_PARA_RETIRADA",
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
  "RETIRADO",
]);

const statusEmAndamento = new Set([
  "CONFIRMADO",
  "EM_PREPARO",
  "PRONTO_PARA_RETIRADA",
  "SAIU_PARA_ENTREGA",
]);

const statusFinalizados = new Set(["RETIRADO", "ENTREGUE"]);

const filtrosPedidos: Array<{ label: string; value: FiltroPedidos }> = [
  { label: "Todos", value: "TODOS" },
  { label: "Em andamento", value: "EM_ANDAMENTO" },
  { label: "Aguardando pagamento", value: "AGUARDANDO_PAGAMENTO" },
  { label: "Expirados", value: "EXPIRADOS" },
  { label: "Cancelados", value: "CANCELADOS" },
  { label: "Retirados/entregues", value: "FINALIZADOS" },
];

const statusLabels: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  EXPIRADO: "Expirado",
  CANCELADO: "Cancelado",
  CONFIRMADO: "Confirmado",
  EM_PREPARO: "Em preparo",
  PRONTO_PARA_RETIRADA: "Pronto para retirada",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue",
  RETIRADO: "Retirado",
};

function formatMoneyFromString(value: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function sortPedidos(pedidos: PedidoAdminRealtimeItem[]) {
  return [...pedidos].sort((a, b) => {
    const pagamentoA = a.pagamentoStatus ?? "PENDENTE";
    const pagamentoB = b.pagamentoStatus ?? "PENDENTE";
    const pesoA = pagamentoPeso[pagamentoA] ?? 1;
    const pesoB = pagamentoPeso[pagamentoB] ?? 1;

    if (pesoA !== pesoB) {
      return pesoA - pesoB;
    }

    return a.codigoPedido - b.codigoPedido;
  });
}

function getProximosStatus(pedido: PedidoAdminRealtimeItem) {
  return (proximosStatusBase[pedido.status] ?? []).filter((status) => {
    if (pedido.tipoEntrega === "RETIRADA" && status === "SAIU_PARA_ENTREGA") {
      return false;
    }

    if (pedido.tipoEntrega === "DELIVERY" && status === "PRONTO_PARA_RETIRADA") {
      return false;
    }

    return true;
  });
}

function normalizePedido(row: Record<string, unknown>): PedidoAdminRealtimeItem {
  const valorTotal = String(row.valorTotal ?? "0");
  const status = String(row.status ?? "AGUARDANDO_PAGAMENTO");

  return {
    id: String(row.id),
    codigoPedido: Number(row.codigoPedido),
    clienteNome: String(row.clienteNome ?? ""),
    clienteTelefone: String(row.clienteTelefone ?? ""),
    status,
    tipoEntrega: row.tipoEntrega === "DELIVERY" ? "DELIVERY" : "RETIRADA",
    valorTotal,
    valorTotalFormatado: formatMoneyFromString(valorTotal),
    pagamentoStatus: statusPagamentoAprovado.has(status) ? "APROVADO" : "PENDENTE",
  };
}

function mergePedidoRealtime(
  pedidoAtual: PedidoAdminRealtimeItem,
  pedidoNovo: PedidoAdminRealtimeItem,
) {
  const pagamentoAtual = pedidoAtual.pagamentoStatus;
  const pagamentoInferido = statusPagamentoAprovado.has(pedidoNovo.status)
    ? "APROVADO"
    : pedidoNovo.pagamentoStatus;

  return {
    ...pedidoAtual,
    ...pedidoNovo,
    pagamentoStatus:
      pagamentoAtual === "RECUSADO" || pagamentoAtual === "ESTORNADO"
        ? pagamentoAtual
        : pagamentoInferido,
  };
}

function upsertPedido(
  pedidos: PedidoAdminRealtimeItem[],
  pedido: PedidoAdminRealtimeItem,
) {
  const jaExiste = pedidos.some((item) => item.id === pedido.id);

  if (!jaExiste) {
    return sortPedidos([pedido, ...pedidos]);
  }

  return sortPedidos(
    pedidos.map((item) =>
      item.id === pedido.id ? mergePedidoRealtime(item, pedido) : item,
    ),
  );
}

function mergePagamentoRealtime(
  pedido: PedidoAdminRealtimeItem,
  pagamentoStatus: string,
) {
  return {
    ...pedido,
    status:
      pagamentoStatus === "APROVADO" &&
      pedido.status === "AGUARDANDO_PAGAMENTO"
        ? "CONFIRMADO"
        : pedido.status,
    pagamentoStatus,
  };
}

function mergeStatusManual(
  pedido: PedidoAdminRealtimeItem,
  status: string,
  pagamentoStatus?: string | null,
) {
  const pagamentoAtualizado =
    pagamentoStatus ??
    (statusPagamentoAprovado.has(status) ? "APROVADO" : pedido.pagamentoStatus);

  return {
    ...pedido,
    status,
    pagamentoStatus: pagamentoAtualizado,
  };
}

function filtrarPedidos(
  pedidos: PedidoAdminRealtimeItem[],
  filtro: FiltroPedidos,
) {
  if (filtro === "EM_ANDAMENTO") {
    return pedidos.filter((pedido) => statusEmAndamento.has(pedido.status));
  }

  if (filtro === "AGUARDANDO_PAGAMENTO") {
    return pedidos.filter((pedido) => pedido.status === "AGUARDANDO_PAGAMENTO");
  }

  if (filtro === "EXPIRADOS") {
    return pedidos.filter((pedido) => pedido.status === "EXPIRADO");
  }

  if (filtro === "CANCELADOS") {
    return pedidos.filter((pedido) => pedido.status === "CANCELADO");
  }

  if (filtro === "FINALIZADOS") {
    return pedidos.filter((pedido) => statusFinalizados.has(pedido.status));
  }

  return pedidos;
}

export function AdminOrdersRealtimeTable({
  initialPedidos,
  supabaseUrl,
  supabaseAnonKey,
  restauranteId,
}: AdminOrdersRealtimeTableProps) {
  const [pedidos, setPedidos] = useState(() => sortPedidos(initialPedidos));
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroPedidos>("TODOS");
  const [realtimeStatus, setRealtimeStatus] = useState(() =>
    supabaseUrl && supabaseAnonKey ? "carregando" : "desconectado",
  );
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const realtimeFilter = restauranteId
    ? `restaurante_id=eq.${restauranteId}`
    : undefined;

  const realtimeLabel =
    !supabaseUrl || !supabaseAnonKey
      ? "nao configurado"
      : realtimeStatus;
  const pedidosFiltrados = filtrarPedidos(pedidos, filtroAtivo);

  function handleStatusUpdated(input: {
    pedidoId: string;
    status: string;
    pagamentoStatus?: string | null;
  }) {
    setPedidos((pedidosAtuais) =>
      sortPedidos(
        pedidosAtuais.map((pedido) =>
          pedido.id === input.pedidoId
            ? mergeStatusManual(pedido, input.status, input.pagamentoStatus)
            : pedido,
        ),
      ),
    );
  }

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return;
    }

    let isMounted = true;
    let channel: SupabaseRealtimeChannel | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    async function subscribeToRealtime() {
      const supabase = await createSupabaseBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
      );

      if (!isMounted) {
        return;
      }

      const pedidosConfig = {
        schema: "public" as const,
        table: "pedidos" as const,
        ...(realtimeFilter ? { filter: realtimeFilter } : {}),
      };
      channel = supabase
        .channel(`admin-pedidos-${restauranteId ?? "single"}`)
        .on(
          "postgres_changes",
          { event: "INSERT", ...pedidosConfig },
          (payload) => {
            const pedidoNovo = normalizePedido(payload.new);
            setPedidos((pedidosAtuais) =>
              upsertPedido(pedidosAtuais, pedidoNovo),
            );
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", ...pedidosConfig },
          (payload) => {
            setPedidos((pedidosAtuais) =>
              upsertPedido(pedidosAtuais, normalizePedido(payload.new)),
            );
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "pagamentos" },
          (payload) => {
            const pedidoId = String(payload.new.pedidoId ?? "");
            const status = String(payload.new.status ?? "PENDENTE");
            setPedidos((pedidosAtuais) => {
              return sortPedidos(
                pedidosAtuais.map((pedido) =>
                  pedido.id === pedidoId
                    ? mergePagamentoRealtime(pedido, status)
                    : pedido,
                ),
              );
            });
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "pagamentos" },
          (payload) => {
            const pedidoId = String(payload.new.pedidoId ?? "");
            const status = String(payload.new.status ?? "PENDENTE");
            setPedidos((pedidosAtuais) => {
              return sortPedidos(
                pedidosAtuais.map((pedido) =>
                  pedido.id === pedidoId
                    ? mergePagamentoRealtime(pedido, status)
                    : pedido,
                ),
              );
            });
          },
        )
        .subscribe((status) => {
          setRealtimeStatus(status);

          if (
            status === "TIMED_OUT" ||
            status === "CHANNEL_ERROR" ||
            status === "CLOSED"
          ) {
            reconnectTimeout = setTimeout(() => {
              setReconnectAttempt((attempt) => attempt + 1);
            }, 1500);
          }
        });
    }

    subscribeToRealtime().catch(() => {
      if (!isMounted) {
        return;
      }

      setRealtimeStatus("erro");
      reconnectTimeout = setTimeout(() => {
        setReconnectAttempt((attempt) => attempt + 1);
      }, 1500);
    });

    return () => {
      isMounted = false;

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      const activeChannel = channel;

      if (activeChannel) {
        createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
          .then((supabase) => {
            supabase.removeChannel(activeChannel);
          })
          .catch(() => undefined);
      }
    };
  }, [
    realtimeFilter,
    reconnectAttempt,
    restauranteId,
    supabaseAnonKey,
    supabaseUrl,
  ]);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          Realtime: {realtimeLabel}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filtrosPedidos.map((filtro) => {
          const isActive = filtroAtivo === filtro.value;

          return (
            <button
              key={filtro.value}
              type="button"
              onClick={() => setFiltroAtivo(filtro.value)}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {filtro.label}
            </button>
          );
        })}
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pedidosFiltrados.map((pedido: PedidoAdminRealtimeItem) => {
              const pagamentoStatus = pedido.pagamentoStatus ?? "PENDENTE";
              const isRecusado =
                pagamentoStatus === "RECUSADO" ||
                pagamentoStatus === "ESTORNADO";
              const proximosStatus = getProximosStatus(pedido);

              return (
                <tr
                  key={pedido.id}
                  className={
                    isRecusado ? "bg-zinc-50 text-zinc-500" : undefined
                  }
                >
                  <td className="px-4 py-3 font-medium">
                    #{pedido.codigoPedido}
                  </td>
                  <td className="px-4 py-3">
                    <div>{pedido.clienteNome}</div>
                    <div className="text-xs text-zinc-500">
                      {pedido.clienteTelefone}
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusLabels[pedido.status]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${
                        pagamentoClasses[pagamentoStatus] ??
                        "bg-zinc-50 text-zinc-600 ring-zinc-200"
                      }`}
                    >
                      {pagamentoLabels[pagamentoStatus] ?? pagamentoStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{pedido.valorTotalFormatado}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <Link
                        href={`/pedido/${pedido.codigoPedido}`}
                        className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium"
                      >
                        Ver
                      </Link>
                      {proximosStatus.length > 0 ? (
                        <OrderStatusForm
                          pedidoId={pedido.id}
                          proximosStatus={proximosStatus}
                          statusLabels={statusLabels}
                          onStatusUpdated={handleStatusUpdated}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {pedidosFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  Nenhum pedido nesta categoria.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
