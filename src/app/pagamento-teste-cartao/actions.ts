"use server";

import { criarPagamentoCartaoTeste } from "@/lib/mercado-pago/criar-pagamento-cartao-teste";

export type PagamentoTesteCartaoState = {
  success: boolean;
  message: string | null;
  paymentId?: string;
  status?: string;
};

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function pagarCartaoTesteAction(
  _state: PagamentoTesteCartaoState,
  formData: FormData,
): Promise<PagamentoTesteCartaoState> {
  try {
    const amount = Number(getString(formData, "amount") || "1");
    const paymentMethodId =
      getString(formData, "paymentMethodId") ||
      getString(formData, "paymentMethodIdFallback");

    if (!paymentMethodId) {
      return {
        success: false,
        message:
          "Bandeira do cartao nao identificada. Selecione Visa, Mastercard ou Amex no campo de bandeira.",
      };
    }

    const result = await criarPagamentoCartaoTeste({
      token: getString(formData, "token"),
      paymentMethodId,
      issuerId: getString(formData, "issuerId") || undefined,
      installments: Number(getString(formData, "installments") || "1"),
      amount,
      description: "Pagamento teste para habilitar conta Mercado Pago",
      payerEmail: getString(formData, "payerEmail"),
      identificationType: getString(formData, "identificationType") || "CPF",
      identificationNumber: getString(formData, "identificationNumber"),
    });

    return {
      success: true,
      message: `Pagamento criado com status: ${result.status}`,
      paymentId: result.id,
      status: result.status,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar o pagamento teste.",
    };
  }
}
