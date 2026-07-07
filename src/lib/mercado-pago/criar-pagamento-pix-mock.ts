import type {
  CriarPagamentoPix,
  CriarPagamentoPixOutput,
} from "@/lib/services/criar-pedido-com-pix";

export const criarPagamentoPixMock: CriarPagamentoPix = async ({
  pedidoId,
  codigoPedido,
  valor,
}): Promise<CriarPagamentoPixOutput> => {
  return {
    gatewayPaymentId: `mock_${pedidoId}`,
    qrCode: `000201 MOCK PIX PEDIDO ${codigoPedido} VALOR ${valor.toFixed(2)}`,
    qrCodeBase64: null,
  };
};
