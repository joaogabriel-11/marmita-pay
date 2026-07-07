import { DomainError } from "@/lib/core/domain-error";
import { consultarPagamentoMercadoPago } from "@/lib/mercado-pago/consultar-pagamento";
import { pedidoRepository } from "@/lib/repositories";
import { processarWebhookPagamento } from "./processar-webhook-pagamento";

export async function sincronizarPagamentoPedido(codigoPedido: number) {
  const pedido = await pedidoRepository.findByCodigoPedido(codigoPedido);

  if (!pedido) {
    throw new DomainError("PEDIDO_NAO_ENCONTRADO", "Pedido nao encontrado.");
  }

  if (
    pedido.status !== "AGUARDANDO_PAGAMENTO" ||
    !pedido.pagamento?.gatewayPaymentId
  ) {
    return pedido;
  }

  const pagamentoGateway = await consultarPagamentoMercadoPago(
    pedido.pagamento.gatewayPaymentId,
  );

  await processarWebhookPagamento(pagamentoGateway);

  return pedidoRepository.findByCodigoPedido(codigoPedido);
}
