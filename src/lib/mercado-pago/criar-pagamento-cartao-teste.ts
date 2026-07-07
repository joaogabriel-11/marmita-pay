import { getMercadoPagoAccessToken, getMercadoPagoApiBaseUrl } from "./client";

export type CriarPagamentoCartaoTesteInput = {
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
  amount: number;
  description: string;
  payerEmail: string;
  identificationType: string;
  identificationNumber: string;
};

export type CriarPagamentoCartaoTesteOutput = {
  id: string;
  status: string;
  statusDetail?: string;
};

type MercadoPagoCardPaymentResponse = {
  id: number | string;
  status: string;
  status_detail?: string;
};

export async function criarPagamentoCartaoTeste({
  token,
  paymentMethodId,
  issuerId,
  installments,
  amount,
  description,
  payerEmail,
  identificationType,
  identificationNumber,
}: CriarPagamentoCartaoTesteInput): Promise<CriarPagamentoCartaoTesteOutput> {
  const response = await fetch(`${getMercadoPagoApiBaseUrl()}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: amount,
      token,
      description,
      installments,
      payment_method_id: paymentMethodId,
      ...(issuerId ? { issuer_id: issuerId } : {}),
      payer: {
        email: payerEmail,
        identification: {
          type: identificationType,
          number: identificationNumber,
        },
      },
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Mercado Pago recusou o pagamento (${response.status}). ${responseBody}`,
    );
  }

  const payment = (await response.json()) as MercadoPagoCardPaymentResponse;

  return {
    id: String(payment.id),
    status: payment.status,
    statusDetail: payment.status_detail,
  };
}
