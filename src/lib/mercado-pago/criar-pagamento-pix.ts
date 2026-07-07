import type {
  CriarPagamentoPix,
  CriarPagamentoPixOutput,
} from "@/lib/services/criar-pedido-com-pix";
import {
  getMercadoPagoAccessToken,
  getMercadoPagoApiBaseUrl,
  getMercadoPagoNotificationUrl,
} from "./client";

type MercadoPagoPaymentResponse = {
  id: number | string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
};

export class MercadoPagoApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly responseBody: string,
  ) {
    super(`Mercado Pago retornou erro ${status}: ${responseBody}`);
    this.name = "MercadoPagoApiError";
  }
}

export const criarPagamentoPixMercadoPago: CriarPagamentoPix = async ({
  pedidoId,
  codigoPedido,
  valor,
  clienteEmail,
}): Promise<CriarPagamentoPixOutput> => {
  const notificationUrl = getMercadoPagoNotificationUrl();
  const payerEmail =
    clienteEmail && clienteEmail.trim().length > 0
      ? clienteEmail
      : `pedido-${codigoPedido}@example.com`;
  const body = {
    transaction_amount: Number(valor.toFixed(2)),
    description: `Pedido #${codigoPedido} - Marmita Pay`,
    payment_method_id: "pix",
    external_reference: pedidoId,
    payer: {
      email: payerEmail,
    },
    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
  };

  const response = await fetch(`${getMercadoPagoApiBaseUrl()}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": pedidoId,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new MercadoPagoApiError(response.status, responseBody);
  }

  const payment = (await response.json()) as MercadoPagoPaymentResponse;
  const qrCode = payment.point_of_interaction?.transaction_data?.qr_code;

  if (!qrCode) {
    throw new Error("Mercado Pago nao retornou o Pix copia e cola.");
  }

  return {
    gatewayPaymentId: String(payment.id),
    qrCode,
    qrCodeBase64:
      payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
  };
};
