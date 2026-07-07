import { NextRequest, NextResponse } from "next/server";
import { DomainError } from "@/lib/core/domain-error";
import { consultarPagamentoMercadoPago } from "@/lib/mercado-pago/consultar-pagamento";
import { validarWebhookMercadoPago } from "@/lib/mercado-pago/validar-webhook";
import { processarWebhookPagamento } from "@/lib/services";

type MercadoPagoWebhookBody = {
  type?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
};

function getPaymentId(request: NextRequest, body: MercadoPagoWebhookBody) {
  const searchParams = request.nextUrl.searchParams;
  return (
    body.data?.id?.toString() ??
    searchParams.get("data.id") ??
    searchParams.get("id")
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MercadoPagoWebhookBody;
    const paymentId = getPaymentId(request, body);

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment id nao informado." },
        { status: 400 },
      );
    }

    if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      const isValid = validarWebhookMercadoPago({
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId: paymentId,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: "Assinatura invalida." },
          { status: 401 },
        );
      }
    }

    const pagamentoGateway = await consultarPagamentoMercadoPago(paymentId);
    const resultado = await processarWebhookPagamento(pagamentoGateway);

    return NextResponse.json({ ok: true, resultado });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao processar webhook.",
      },
      { status: 500 },
    );
  }
}
