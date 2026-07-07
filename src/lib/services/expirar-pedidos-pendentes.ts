import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  createPagamentoRepository,
  createPedidoRepository,
} from "@/lib/repositories";

export async function expirarPedidosPendentes(agora = new Date()) {
  return prisma.$transaction(
    async (tx) => {
      const pedidos = createPedidoRepository(tx);
      const pagamentos = createPagamentoRepository(tx);
      const expirados = await pedidos.listPendentesExpirados(agora);
      const pedidoIds = expirados.map((pedido) => pedido.id);

      if (pedidoIds.length === 0) {
        return { pedidosExpirados: 0, pagamentosAtualizados: 0 };
      }

      const [pedidosExpirados, pagamentosAtualizados] = await Promise.all([
        pedidos.expireMany(pedidoIds),
        pagamentos.updateManyByPedidoIds(pedidoIds, {
          status: "RECUSADO",
          recusadoEm: agora,
        }),
      ]);

      return {
        pedidosExpirados: pedidosExpirados.count,
        pagamentosAtualizados: pagamentosAtualizados.count,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    },
  );
}
