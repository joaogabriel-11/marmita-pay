"use client";

import { useEffect, useState } from "react";

type OrderStatusPollingProps = {
  codigoPedido: number;
  initialStatus: string;
  initialStatusLabel: string;
  initialPagamentoStatus: string | null;
};

type PedidoStatusResponse = {
  status: string;
  statusLabel: string;
  pagamentoStatus: string | null;
};

const finalStatuses = new Set(["CONFIRMADO", "EXPIRADO", "CANCELADO"]);

const pagamentoStatusLabels: Record<string, string> = {
  PENDENTE: "Aguardando",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  ESTORNADO: "Estornado",
};

const pagamentoStatusClasses: Record<string, string> = {
  PENDENTE: "bg-amber-50 text-amber-700 ring-amber-200",
  APROVADO: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  RECUSADO: "bg-red-50 text-red-700 ring-red-200",
  ESTORNADO: "bg-red-50 text-red-700 ring-red-200",
};

export function OrderStatusPolling({
  codigoPedido,
  initialStatus,
  initialStatusLabel,
  initialPagamentoStatus,
}: OrderStatusPollingProps) {
  const [status, setStatus] = useState(initialStatus);
  const [statusLabel, setStatusLabel] = useState(initialStatusLabel);
  const [pagamentoStatus, setPagamentoStatus] = useState<string | null>(
    initialPagamentoStatus,
  );

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
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [codigoPedido, status]);

  return (
    <div className="mt-4 rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800">
      {statusLabel}
      {pagamentoStatus ? (
        <span
          className={`ml-2 inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${
            pagamentoStatusClasses[pagamentoStatus] ??
            "bg-zinc-50 text-zinc-600 ring-zinc-200"
          }`}
        >
          Pagamento: {pagamentoStatusLabels[pagamentoStatus] ?? pagamentoStatus}
        </span>
      ) : null}
    </div>
  );
}
