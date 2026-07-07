import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/core/domain-error";
import prisma from "@/lib/prisma";
import {
  createCardapioRepository,
  createPagamentoRepository,
  createPedidoRepository,
  pagamentoRepository,
} from "@/lib/repositories";

export type PagamentoGatewayConfirmado = {
  gatewayPaymentId: string;
  externalReference: string;
  status: "approved" | "rejected" | "pending";
  valorPago: Prisma.Decimal;
};

export async function processarWebhookPagamento(
  pagamentoGateway: PagamentoGatewayConfirmado,
) {
  if (pagamentoGateway.status !== "approved") {
    return { processado: false, motivo: "Pagamento ainda nao aprovado." };
  }

  const pagamento = await pagamentoRepository.findByExternalReference(
    pagamentoGateway.externalReference,
  );

  if (!pagamento) {
    throw new DomainError(
      "PAGAMENTO_NAO_ENCONTRADO",
      "Pagamento nao encontrado para o pedido informado.",
    );
  }

  if (pagamento.status === "APROVADO") {
    return { processado: false, motivo: "Pagamento ja processado." };
  }

  if (!pagamento.valorEsperado.equals(pagamentoGateway.valorPago)) {
    throw new DomainError(
      "VALOR_PAGO_DIVERGENTE",
      "Valor pago divergente do valor esperado.",
    );
  }

  if (pagamento.pedido.status !== "AGUARDANDO_PAGAMENTO") {
    throw new DomainError(
      "PEDIDO_NAO_AGUARDA_PAGAMENTO",
      "Pedido nao esta aguardando pagamento.",
    );
  }

  const resultado = await prisma.$transaction(
    async (tx) => {
      const pagamentos = createPagamentoRepository(tx);
      const pedidos = createPedidoRepository(tx);
      const cardapios = createCardapioRepository(tx);

      const pagamentoAtualizado = await pagamentos.approvePending(pagamento.id, {
        status: "APROVADO",
        gatewayPaymentId: pagamentoGateway.gatewayPaymentId,
        valorPago: pagamentoGateway.valorPago,
        confirmadoEm: new Date(),
      });

      if (pagamentoAtualizado.count === 0) {
        return { processado: false, motivo: "Pagamento ja processado." };
      }

      await pedidos.update(pagamento.pedidoId, {
        status: "CONFIRMADO",
      });

      const pedidoCompleto = await pedidos.findById(pagamento.pedidoId);

      if (!pedidoCompleto) {
        throw new DomainError("PEDIDO_NAO_ENCONTRADO", "Pedido nao encontrado.");
      }

      await Promise.all(
        pedidoCompleto.itens.map((item) =>
          cardapios.incrementQuantidadeVendida(
            item.cardapioDiaId,
            item.quantidade,
          ),
        ),
      );

      return { processado: true };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    },
  );

  return resultado;
}
