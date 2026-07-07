import { z } from "zod";

export const requiredTextSchema = z
  .string()
  .trim()
  .min(1, "Campo obrigatorio.");

export const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

export const idSchema = requiredTextSchema;

export const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+([.,]\d{1,2})?$/, "Informe um valor monetario valido.")
  .transform((value) => value.replace(",", "."));

export const optionalMoneySchema = z
  .union([moneySchema, z.literal("").transform(() => undefined)])
  .optional();

export const positiveIntSchema = z.coerce
  .number()
  .int("Informe um numero inteiro.")
  .positive("Informe um numero maior que zero.");

export const nonNegativeIntSchema = z.coerce
  .number()
  .int("Informe um numero inteiro.")
  .min(0, "Informe um numero maior ou igual a zero.");

export const orderSchema = z.coerce
  .number()
  .int("Informe um numero inteiro.")
  .min(0, "A ordem nao pode ser negativa.")
  .default(0);

export const emailSchema = z
  .string()
  .trim()
  .email("Informe um email valido.")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\D*(?:\d\D*){10,13}$/, "Informe um telefone valido.");

export const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:mm.");

export const dateOnlySchema = z.coerce.date();

export const booleanSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (["true", "1", "on", "yes"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "off", "no"].includes(normalizedValue)) {
    return false;
  }

  return value;
}, z.boolean());
