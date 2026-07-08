import type { Prisma, StatusPagamento } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { DbClient } from "./types";

export function createPagamentoRepository(db: DbClient = prisma) {
  return {
    findById(id: string) {
      return db.pagamento.findUnique({
        where: { id },
        include: { pedido: true },
      });
    },

    findByPedidoId(pedidoId: string) {
      return db.pagamento.findUnique({
        where: { pedidoId },
        include: { pedido: true },
      });
    },

    findByGatewayPaymentId(gatewayPaymentId: string) {
      return db.pagamento.findUnique({
        where: { gatewayPaymentId },
        include: { pedido: true },
      });
    },

    findByExternalReference(externalReference: string) {
      return db.pagamento.findUnique({
        where: { externalReference },
        include: { pedido: true },
      });
    },

    listByStatus(status: StatusPagamento) {
      return db.pagamento.findMany({
        where: { status },
        include: { pedido: true },
        orderBy: { createdAt: "desc" },
      });
    },

    create(data: Prisma.PagamentoCreateInput) {
      return db.pagamento.create({ data });
    },

    update(id: string, data: Prisma.PagamentoUpdateInput) {
      return db.pagamento.update({ where: { id }, data });
    },

    approvePending(id: string, data: Prisma.PagamentoUpdateManyMutationInput) {
      return db.pagamento.updateMany({
        where: { id, status: "PENDENTE" },
        data,
      });
    },

    updateByPedidoId(pedidoId: string, data: Prisma.PagamentoUpdateInput) {
      return db.pagamento.update({ where: { pedidoId }, data });
    },

    updatePendingByPedidoId(
      pedidoId: string,
      data: Prisma.PagamentoUpdateManyMutationInput,
    ) {
      return db.pagamento.updateMany({
        where: { pedidoId, status: "PENDENTE" },
        data,
      });
    },

    updateManyByPedidoIds(
      pedidoIds: string[],
      data: Prisma.PagamentoUpdateManyMutationInput,
    ) {
      return db.pagamento.updateMany({
        where: { pedidoId: { in: pedidoIds } },
        data,
      });
    },
  };
}

export const pagamentoRepository = createPagamentoRepository();
