"use client";

import { useActionState, useEffect, useState } from "react";
import {
  atualizarStatusPedidoAction,
  type AtualizarStatusPedidoState,
} from "@/app/admin/pedidos/actions";

type OrderStatusFormProps = {
  pedidoId: string;
  proximosStatus: string[];
  statusLabels: Record<string, string>;
  onStatusUpdated?: (input: {
    pedidoId: string;
    status: string;
    pagamentoStatus?: string | null;
  }) => void;
};

const initialState: AtualizarStatusPedidoState = {
  ok: false,
};

export function OrderStatusForm({
  pedidoId,
  proximosStatus,
  statusLabels,
  onStatusUpdated,
}: OrderStatusFormProps) {
  const [selectedStatus, setSelectedStatus] = useState(proximosStatus[0] ?? "");
  const [state, formAction, isPending] = useActionState(
    atualizarStatusPedidoAction,
    initialState,
  );

  useEffect(() => {
    if (!state.ok || !state.pedidoId || !state.status) {
      return;
    }

    onStatusUpdated?.({
      pedidoId: state.pedidoId,
      status: state.status,
      pagamentoStatus: state.pagamentoStatus,
    });
  }, [onStatusUpdated, state]);

  if (proximosStatus.length === 0) {
    return null;
  }

  return (
    <form action={formAction} className="grid min-w-64 gap-2">
      <input type="hidden" name="pedidoId" value={pedidoId} />
      <div className="flex gap-2">
        <select
          name="status"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 px-2 py-2 text-xs"
        >
          {proximosStatus.map((status: string) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
        <button
          disabled={isPending}
          className="rounded-md bg-zinc-950 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
      {selectedStatus === "CANCELADO" ? (
        <input
          name="motivoCancelamento"
          placeholder="Motivo do cancelamento"
          className="rounded-md border border-zinc-300 px-2 py-2 text-xs"
        />
      ) : null}
      {!state.ok && state.message ? (
        <p className="text-xs text-red-600">{state.message}</p>
      ) : null}
    </form>
  );
}
