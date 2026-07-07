import type { CriarPagamentoPix } from "@/lib/services/criar-pedido-com-pix";
import { criarPagamentoPixMercadoPago } from "./criar-pagamento-pix";
import { criarPagamentoPixMock } from "./criar-pagamento-pix-mock";

export function getCriarPagamentoPixProvider(): CriarPagamentoPix {
  const useMock = process.env.MERCADOPAGO_USE_MOCK === "true";

  if (useMock || !process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return criarPagamentoPixMock;
  }

  return criarPagamentoPixMercadoPago;
}
