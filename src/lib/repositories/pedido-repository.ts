import type { Prisma, StatusPedido } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { DbClient } from "./types";

const pedidoCompletoInclude = {
  itens: {
    include: {
      cardapioDia: {
        include: {
          prato: {
            include: { categoria: true },
          },
        },
      },
    },
  },
  pagamento: true,
  zonaEntrega: true,
} satisfies Prisma.PedidoInclude;

export function createPedidoRepository(db: DbClient = prisma) {
  return {
    findById(id: string) {
      return db.pedido.findUnique({
        where: { id },
        include: pedidoCompletoInclude,
      });
    },

    findByCodigoPedido(codigoPedido: number) {
      return db.pedido.findUnique({
        where: { codigoPedido },
        include: pedidoCompletoInclude,
      });
    },

    list(params?: {
      status?: StatusPedido;
      dataEntregaOuRetirada?: Date;
      take?: number;
      skip?: number;
    }) {
      return db.pedido.findMany({
        where: {
          status: params?.status,
          dataEntregaOuRetirada: params?.dataEntregaOuRetirada,
        },
        include: pedidoCompletoInclude,
        orderBy: { createdAt: "desc" },
        take: params?.take,
        skip: params?.skip,
      });
    },

    create(data: Prisma.PedidoCreateInput) {
      return db.pedido.create({
        data,
        include: pedidoCompletoInclude,
      });
    },

    update(id: string, data: Prisma.PedidoUpdateInput) {
      return db.pedido.update({
        where: { id },
        data,
        include: pedidoCompletoInclude,
      });
    },

    listReservasAtivas(cardapioDiaIds: string[], now: Date) {
      return db.itemPedido.groupBy({
        by: ["cardapioDiaId"],
        where: {
          cardapioDiaId: { in: cardapioDiaIds },
          pedido: {
            status: "AGUARDANDO_PAGAMENTO",
            expiraEm: { gt: now },
          },
        },
        _sum: { quantidade: true },
      });
    },

    listPendentesExpirados(now: Date) {
      return db.pedido.findMany({
        where: {
          status: "AGUARDANDO_PAGAMENTO",
          expiraEm: { lt: now },
        },
        include: { pagamento: true },
      });
    },

    expireMany(ids: string[]) {
      return db.pedido.updateMany({
        where: {
          id: { in: ids },
          status: "AGUARDANDO_PAGAMENTO",
        },
        data: { status: "EXPIRADO" },
      });
    },
  };
}

export const pedidoRepository = createPedidoRepository();
