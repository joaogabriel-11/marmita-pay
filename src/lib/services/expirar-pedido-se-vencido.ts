import prisma from "@/lib/prisma";
import {
  createPagamentoRepository,
  createPedidoRepository,
} from "@/lib/repositories";

export async function expirarPedidoSeVencido(
  codigoPedido: number,
  agora = new Date(),
) {
  const pedido = await createPedidoRepository().findByCodigoPedido(codigoPedido);

  if (
    !pedido ||
    pedido.status !== "AGUARDANDO_PAGAMENTO" ||
    pedido.expiraEm > agora
  ) {
    return pedido;
  }

  await prisma.$transaction(async (tx) => {
    const pedidos = createPedidoRepository(tx);
    const pagamentos = createPagamentoRepository(tx);

    await Promise.all([
      pedidos.expireOne(pedido.id),
      pagamentos.updateByPedidoId(pedido.id, {
        status: "RECUSADO",
        recusadoEm: agora,
      }),
    ]);
  });

  return createPedidoRepository().findByCodigoPedido(codigoPedido);
}
