"use server";

import { z } from "zod";
import { DomainError } from "@/lib/core/domain-error";
import { MercadoPagoApiError } from "@/lib/mercado-pago/criar-pagamento-pix";
import { getCriarPagamentoPixProvider } from "@/lib/mercado-pago/provider";
import { criarPedidoComPix } from "@/lib/services";
import type { CheckoutInput } from "@/lib/validations";
import type { CheckoutActionState } from "./state";

function getFormString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function parseItens(formData: FormData): CheckoutInput["itens"] {
  const rawItems = getFormString(formData, "itens");

  if (!rawItems) {
    return [];
  }

  type ParsedCheckoutItem = {
    cardapioDiaId: string;
    quantidade: number;
  };

  const parsedItems = JSON.parse(rawItems) as ParsedCheckoutItem[];

  return parsedItems.map((item: ParsedCheckoutItem) => ({
    cardapioDiaId: item.cardapioDiaId,
    quantidade: item.quantidade,
  }));
}

export async function finalizarCheckoutAction(
  _state: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  try {
    const tipoEntrega = getFormString(formData, "tipoEntrega");

    if (tipoEntrega !== "DELIVERY" && tipoEntrega !== "RETIRADA") {
      return {
        success: false,
        message: "Escolha uma modalidade de entrega valida.",
      };
    }

    const input: CheckoutInput = {
      clienteNome: getFormString(formData, "clienteNome") ?? "",
      clienteTelefone: getFormString(formData, "clienteTelefone") ?? "",
      clienteEmail: getFormString(formData, "clienteEmail"),
      tipoEntrega,
      enderecoRua: getFormString(formData, "enderecoRua"),
      enderecoNumero: getFormString(formData, "enderecoNumero"),
      enderecoBairro: getFormString(formData, "enderecoBairro"),
      enderecoComplemento: getFormString(formData, "enderecoComplemento"),
      zonaEntregaId: getFormString(formData, "zonaEntregaId"),
      itens: parseItens(formData),
    };

    const pedido = await criarPedidoComPix(
      input,
      getCriarPagamentoPixProvider(),
    );

    if (!pedido) {
      return {
        success: false,
        message: "Nao foi possivel criar o pedido.",
      };
    }

    return {
      success: true,
      codigoPedido: pedido.codigoPedido,
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, message: error.message };
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message ?? "Dados invalidos.",
      };
    }

    if (error instanceof MercadoPagoApiError) {
      return {
        success: false,
        message: `Mercado Pago recusou a criacao do Pix (${error.status}). ${error.responseBody}`,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: "Nao foi possivel finalizar o pedido.",
    };
  }
}
