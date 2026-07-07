import { z } from "zod";
import { booleanSchema, moneySchema, requiredTextSchema } from "./common";

export const zonaEntregaSchema = z.object({
  nome: requiredTextSchema.max(100, "Use no maximo 100 caracteres."),
  taxaEntrega: moneySchema,
  ativo: booleanSchema.default(true),
});

export type ZonaEntregaInput = z.infer<typeof zonaEntregaSchema>;
