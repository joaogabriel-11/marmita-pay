import { Prisma } from "@prisma/client";
import type { PagamentoGatewayConfirmado } from "@/lib/services";
import { getMercadoPagoAccessToken, getMercadoPagoApiBaseUrl } from "./client";

type MercadoPagoPaymentStatus = "approved" | "rejected" | "pending" | string;

type MercadoPagoPaymentResponse = {
  id: number | string;
  status: MercadoPagoPaymentStatus;
  transaction_amount?: number;
  transaction_details?: {
    total_paid_amount?: number;
  };
  external_reference?: string;
};

function mapStatus(status: MercadoPagoPaymentStatus) {
  if (status === "approved") {
    return "approved";
  }

  if (status === "rejected" || status === "cancelled" || status === "refunded") {
    return "rejected";
  }

  return "pending";
}

export async function consultarPagamentoMercadoPago(
  paymentId: string,
): Promise<PagamentoGatewayConfirmado> {
  const response = await fetch(
    `${getMercadoPagoApiBaseUrl()}/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      },
    },
  );

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Erro ao consultar pagamento no Mercado Pago: ${response.status} ${responseBody}`,
    );
  }

  const payment = (await response.json()) as MercadoPagoPaymentResponse;
  const valorPago =
    payment.transaction_details?.total_paid_amount ??
    payment.transaction_amount ??
    0;

  return {
    gatewayPaymentId: String(payment.id),
    externalReference: payment.external_reference ?? "",
    status: mapStatus(payment.status),
    valorPago: new Prisma.Decimal(valorPago),
  };
}
