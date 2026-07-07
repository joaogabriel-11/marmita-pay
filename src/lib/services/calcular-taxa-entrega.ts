import type { ConfiguracaoRestaurante, ZonaEntrega } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/core/domain-error";

type CalcularTaxaEntregaInput = {
  tipoEntrega: "DELIVERY" | "RETIRADA";
  zonaEntrega?: Pick<ZonaEntrega, "taxaEntrega" | "ativo"> | null;
  configuracao: Pick<ConfiguracaoRestaurante, "taxaEntregaPadrao">;
};

export function calcularTaxaEntrega({
  tipoEntrega,
  zonaEntrega,
  configuracao,
}: CalcularTaxaEntregaInput): Prisma.Decimal {
  if (tipoEntrega === "RETIRADA") {
    return new Prisma.Decimal(0);
  }

  if (zonaEntrega?.ativo) {
    return zonaEntrega.taxaEntrega;
  }

  if (configuracao.taxaEntregaPadrao) {
    return configuracao.taxaEntregaPadrao;
  }

  throw new DomainError(
    "ZONA_ENTREGA_INVALIDA",
    "Nao encontramos uma taxa de entrega para esse endereco.",
  );
}
