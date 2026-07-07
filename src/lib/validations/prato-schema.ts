import { z } from "zod";
import {
  booleanSchema,
  idSchema,
  moneySchema,
  optionalTextSchema,
  requiredTextSchema,
} from "./common";

export const pratoSchema = z.object({
  nome: requiredTextSchema.max(120, "Use no maximo 120 caracteres."),
  descricao: requiredTextSchema.max(600, "Use no maximo 600 caracteres."),
  fotoUrl: z
    .string()
    .trim()
    .url("Informe uma URL valida.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  categoriaId: idSchema,
  precoBase: moneySchema,
  ativo: booleanSchema.default(true),
  observacoesInternas: optionalTextSchema,
});

export type PratoInput = z.infer<typeof pratoSchema>;
