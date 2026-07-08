import { z } from "zod";
import {
  booleanSchema,
  moneySchema,
  optionalMoneySchema,
  optionalTextSchema,
  phoneSchema,
  positiveIntSchema,
  requiredTextSchema,
  timeSchema,
} from "./common";

export const modoEntregaSchema = z.enum(["DELIVERY", "RETIRADA", "AMBOS"]);

export const configuracaoSchema = z.object({
  nomeRestaurante: requiredTextSchema.max(
    120,
    "Use no maximo 120 caracteres.",
  ),
  modoEntrega: modoEntregaSchema,
  horarioCorte: timeSchema,
  pedidosAtivos: booleanSchema.default(true),
  motivoFechamento: optionalTextSchema,
  taxaEntregaPadrao: optionalMoneySchema,
  pedidoMinimo: optionalMoneySchema,
  tempoPreparoMinutos: positiveIntSchema.optional(),
  tempoEntregaMinutos: positiveIntSchema.optional(),
  whatsappContato: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
  enderecoCep: optionalTextSchema,
  enderecoLogradouro: optionalTextSchema,
  enderecoNumero: optionalTextSchema,
  enderecoComplemento: optionalTextSchema,
  enderecoBairro: optionalTextSchema,
  enderecoCidade: optionalTextSchema,
  enderecoEstado: optionalTextSchema,
  enderecoUf: optionalTextSchema,
});

export const configuracaoCreateSchema = configuracaoSchema.extend({
  taxaEntregaPadrao: moneySchema.optional(),
  pedidoMinimo: moneySchema.optional(),
});

export type ConfiguracaoInput = z.infer<typeof configuracaoSchema>;
