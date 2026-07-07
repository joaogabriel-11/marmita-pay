import { Prisma } from "@prisma/client";

export type MoneyInput = Prisma.Decimal | number | string;

export function toDecimal(value: MoneyInput): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function addMoney(values: MoneyInput[]): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>(
    (total, value) => total.plus(toDecimal(value)),
    new Prisma.Decimal(0),
  );
}

export function multiplyMoney(
  value: MoneyInput,
  quantity: number,
): Prisma.Decimal {
  return toDecimal(value).mul(quantity);
}

export function formatMoney(value: MoneyInput): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(toDecimal(value).toNumber());
}
