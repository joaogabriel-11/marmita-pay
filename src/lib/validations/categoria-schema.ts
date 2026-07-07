import { z } from "zod";
import { booleanSchema, orderSchema, requiredTextSchema } from "./common";

export const categoriaSchema = z.object({
  nome: requiredTextSchema.max(80, "Use no maximo 80 caracteres."),
  ordem: orderSchema,
  ativo: booleanSchema.default(true),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
