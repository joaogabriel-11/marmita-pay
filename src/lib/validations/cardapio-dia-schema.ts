import { z } from "zod";
import {
  booleanSchema,
  dateOnlySchema,
  idSchema,
  moneySchema,
  nonNegativeIntSchema,
  orderSchema,
  positiveIntSchema,
} from "./common";

export const cardapioDiaSchema = z.object({
  pratoId: idSchema,
  data: dateOnlySchema,
  precoDoDia: moneySchema,
  quantidadeDisponivel: positiveIntSchema,
  quantidadeVendida: nonNegativeIntSchema.default(0),
  ativo: booleanSchema.default(true),
  destaque: booleanSchema.default(false),
  ordem: orderSchema,
});

export type CardapioDiaInput = z.infer<typeof cardapioDiaSchema>;
