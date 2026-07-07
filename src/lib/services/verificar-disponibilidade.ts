import type { CardapioDia } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/core/domain-error";

type ReservaAtiva = {
  cardapioDiaId: string;
  quantidadeReservada: number;
};

type ItemSolicitado = {
  cardapioDiaId: string;
  quantidade: number;
};

export type DisponibilidadeCardapio = {
  cardapioDiaId: string;
  quantidadeDisponivel: number;
  quantidadeVendida: number;
  quantidadeReservada: number;
  disponivelReal: number;
};

export function calcularDisponibilidadeReal(
  cardapio: Pick<
    CardapioDia,
    "id" | "quantidadeDisponivel" | "quantidadeVendida"
  >,
  quantidadeReservada: number,
): DisponibilidadeCardapio {
  const disponivelReal =
    cardapio.quantidadeDisponivel -
    cardapio.quantidadeVendida -
    quantidadeReservada;

  return {
    cardapioDiaId: cardapio.id,
    quantidadeDisponivel: cardapio.quantidadeDisponivel,
    quantidadeVendida: cardapio.quantidadeVendida,
    quantidadeReservada,
    disponivelReal: Math.max(0, disponivelReal),
  };
}

export function mapearReservasAtivas(
  reservas: Array<{
    cardapioDiaId: string;
    _sum: { quantidade: number | null };
  }>,
): ReservaAtiva[] {
  return reservas.map((reserva) => ({
    cardapioDiaId: reserva.cardapioDiaId,
    quantidadeReservada: reserva._sum.quantidade ?? 0,
  }));
}

export function assertItensDisponiveis(
  cardapios: Array<
    Pick<
      CardapioDia,
      | "id"
      | "ativo"
      | "quantidadeDisponivel"
      | "quantidadeVendida"
      | "precoDoDia"
    >
  >,
  reservas: ReservaAtiva[],
  itens: ItemSolicitado[],
): void {
  const cardapiosPorId = new Map(cardapios.map((cardapio) => [cardapio.id, cardapio]));
  const reservasPorCardapio = new Map(
    reservas.map((reserva) => [
      reserva.cardapioDiaId,
      reserva.quantidadeReservada,
    ]),
  );

  for (const item of itens) {
    const cardapio = cardapiosPorId.get(item.cardapioDiaId);

    if (!cardapio || !cardapio.ativo) {
      throw new DomainError(
        "ITEM_INDISPONIVEL",
        "Um dos itens selecionados nao esta disponivel.",
      );
    }

    const disponibilidade = calcularDisponibilidadeReal(
      cardapio,
      reservasPorCardapio.get(item.cardapioDiaId) ?? 0,
    );

    if (disponibilidade.disponivelReal < item.quantidade) {
      throw new DomainError(
        "ESTOQUE_INSUFICIENTE",
        "Um dos itens selecionados nao possui quantidade suficiente.",
      );
    }
  }
}

export function somarItensPedido(
  itens: ItemSolicitado[],
  cardapios: Array<Pick<CardapioDia, "id" | "precoDoDia">>,
): Prisma.Decimal {
  const cardapiosPorId = new Map(cardapios.map((cardapio) => [cardapio.id, cardapio]));

  return itens.reduce((total, item) => {
    const cardapio = cardapiosPorId.get(item.cardapioDiaId);

    if (!cardapio) {
      throw new DomainError(
        "ITEM_INDISPONIVEL",
        "Um dos itens selecionados nao esta disponivel.",
      );
    }

    return total.plus(cardapio.precoDoDia.mul(item.quantidade));
  }, new Prisma.Decimal(0));
}
