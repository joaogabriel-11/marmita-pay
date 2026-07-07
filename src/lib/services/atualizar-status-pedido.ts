import type { Pedido, StatusPedido, TipoEntregaPedido } from "@prisma/client";
import { DomainError } from "@/lib/core/domain-error";
import { pedidoRepository } from "@/lib/repositories";

const transicoesBase: Record<StatusPedido, StatusPedido[]> = {
  AGUARDANDO_PAGAMENTO: ["CONFIRMADO", "EXPIRADO", "CANCELADO"],
  EXPIRADO: [],
  CANCELADO: [],
  CONFIRMADO: ["EM_PREPARO", "CANCELADO"],
  EM_PREPARO: ["PRONTO_PARA_RETIRADA", "SAIU_PARA_ENTREGA", "CANCELADO"],
  PRONTO_PARA_RETIRADA: ["RETIRADO"],
  SAIU_PARA_ENTREGA: ["ENTREGUE"],
  ENTREGUE: [],
  RETIRADO: [],
};

function assertStatusCompativelComEntrega(
  tipoEntrega: TipoEntregaPedido,
  novoStatus: StatusPedido,
): void {
  if (tipoEntrega === "RETIRADA" && novoStatus === "SAIU_PARA_ENTREGA") {
    throw new DomainError(
      "STATUS_INCOMPATIVEL",
      "Pedido de retirada nao pode sair para entrega.",
    );
  }

  if (tipoEntrega === "DELIVERY" && novoStatus === "PRONTO_PARA_RETIRADA") {
    throw new DomainError(
      "STATUS_INCOMPATIVEL",
      "Pedido de entrega nao pode ficar pronto para retirada.",
    );
  }
}

export function assertTransicaoStatusPedido(
  pedido: Pick<Pedido, "status" | "tipoEntrega">,
  novoStatus: StatusPedido,
): void {
  const permitidos = transicoesBase[pedido.status];

  if (!permitidos.includes(novoStatus)) {
    throw new DomainError(
      "TRANSICAO_STATUS_INVALIDA",
      "Essa mudanca de status nao e permitida.",
    );
  }

  assertStatusCompativelComEntrega(pedido.tipoEntrega, novoStatus);
}

export async function atualizarStatusPedido(input: {
  pedidoId: string;
  status: StatusPedido;
  motivoCancelamento?: string;
}) {
  const pedido = await pedidoRepository.findById(input.pedidoId);

  if (!pedido) {
    throw new DomainError("PEDIDO_NAO_ENCONTRADO", "Pedido nao encontrado.");
  }

  assertTransicaoStatusPedido(pedido, input.status);

  return pedidoRepository.update(input.pedidoId, {
    status: input.status,
    canceladoEm: input.status === "CANCELADO" ? new Date() : undefined,
    motivoCancelamento:
      input.status === "CANCELADO" ? input.motivoCancelamento : undefined,
  });
}
