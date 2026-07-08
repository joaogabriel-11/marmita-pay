import type { ConfiguracaoRestaurante } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/core/domain-error";

type CalcularTaxaEntregaInput = {
  tipoEntrega: "DELIVERY" | "RETIRADA";
  configuracao: Pick<ConfiguracaoRestaurante, "taxaEntregaPadrao">;
};

export function calcularTaxaEntrega({
  tipoEntrega,
  configuracao,
}: CalcularTaxaEntregaInput): Prisma.Decimal {
  if (tipoEntrega === "RETIRADA") {
    return new Prisma.Decimal(0);
  }

  if (configuracao.taxaEntregaPadrao) {
    return configuracao.taxaEntregaPadrao;
  }

  throw new DomainError(
    "TAXA_ENTREGA_NAO_CONFIGURADA",
    "Nao encontramos uma taxa de entrega configurada.",
  );
}
