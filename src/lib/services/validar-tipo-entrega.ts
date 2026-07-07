import type { ModoEntrega, TipoEntregaPedido } from "@prisma/client";
import { DomainError } from "@/lib/core/domain-error";

export function assertTipoEntregaPermitido(
  modoEntrega: ModoEntrega,
  tipoEntrega: TipoEntregaPedido,
): void {
  if (modoEntrega === "AMBOS") {
    return;
  }

  if (modoEntrega !== tipoEntrega) {
    throw new DomainError(
      "TIPO_ENTREGA_INDISPONIVEL",
      "A modalidade escolhida nao esta disponivel no momento.",
    );
  }
}
