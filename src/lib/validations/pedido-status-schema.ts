import { z } from "zod";
import { idSchema, optionalTextSchema } from "./common";

export const statusPedidoSchema = z.enum([
  "AGUARDANDO_PAGAMENTO",
  "EXPIRADO",
  "CANCELADO",
  "CONFIRMADO",
  "EM_PREPARO",
  "PRONTO_PARA_RETIRADA",
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
  "RETIRADO",
]);

export const atualizarStatusPedidoSchema = z.object({
  pedidoId: idSchema,
  status: statusPedidoSchema,
  motivoCancelamento: optionalTextSchema,
});

export type AtualizarStatusPedidoInput = z.infer<
  typeof atualizarStatusPedidoSchema
>;
