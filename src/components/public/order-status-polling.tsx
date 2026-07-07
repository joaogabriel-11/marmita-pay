"use client";

import { useEffect, useState } from "react";

type OrderStatusPollingProps = {
  codigoPedido: number;
  initialStatus: string;
  initialStatusLabel: string;
};

type PedidoStatusResponse = {
  status: string;
  statusLabel: string;
  pagamentoStatus: string | null;
};

const finalStatuses = new Set(["CONFIRMADO", "EXPIRADO", "CANCELADO"]);

export function OrderStatusPolling({
  codigoPedido,
  initialStatus,
  initialStatusLabel,
}: OrderStatusPollingProps) {
  const [status, setStatus] = useState(initialStatus);
  const [statusLabel, setStatusLabel] = useState(initialStatusLabel);
  const [pagamentoStatus, setPagamentoStatus] = useState<string | null>(null);

  useEffect(() => {
    if (finalStatuses.has(status)) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const response = await fetch(
        `/api/pedidos/${codigoPedido}/status?sync=1`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as PedidoStatusResponse;
      setStatus(data.status);
      setStatusLabel(data.statusLabel);
      setPagamentoStatus(data.pagamentoStatus);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [codigoPedido, status]);

  return (
    <div className="mt-4 rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800">
      {statusLabel}
      {pagamentoStatus ? (
        <span className="ml-2 text-xs font-normal text-zinc-500">
          Pagamento: {pagamentoStatus}
        </span>
      ) : null}
    </div>
  );
}
