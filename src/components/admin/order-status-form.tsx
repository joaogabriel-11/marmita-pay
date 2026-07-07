"use client";

import { useState } from "react";
import { atualizarStatusPedidoAction } from "@/app/admin/pedidos/actions";

type OrderStatusFormProps = {
  pedidoId: string;
  proximosStatus: string[];
  statusLabels: Record<string, string>;
};

export function OrderStatusForm({
  pedidoId,
  proximosStatus,
  statusLabels,
}: OrderStatusFormProps) {
  const [selectedStatus, setSelectedStatus] = useState(proximosStatus[0] ?? "");

  if (proximosStatus.length === 0) {
    return null;
  }

  return (
    <form action={atualizarStatusPedidoAction} className="grid min-w-64 gap-2">
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
        <button className="rounded-md bg-zinc-950 px-3 py-2 text-xs font-medium text-white">
          Salvar
        </button>
      </div>
      {selectedStatus === "CANCELADO" ? (
        <input
          name="motivoCancelamento"
          placeholder="Motivo do cancelamento"
          className="rounded-md border border-zinc-300 px-2 py-2 text-xs"
        />
      ) : null}
    </form>
  );
}
