import { z } from "zod";
import {
  emailSchema,
  idSchema,
  optionalTextSchema,
  phoneSchema,
  positiveIntSchema,
  requiredTextSchema,
} from "./common";

export const tipoEntregaPedidoSchema = z.enum(["DELIVERY", "RETIRADA"]);

export const checkoutItemSchema = z.object({
  cardapioDiaId: idSchema,
  quantidade: positiveIntSchema.max(99, "Quantidade maxima por item: 99."),
  observacoes: optionalTextSchema,
});

export const checkoutSchema = z
  .object({
    clienteNome: requiredTextSchema.max(120, "Use no maximo 120 caracteres."),
    clienteTelefone: phoneSchema,
    clienteEmail: emailSchema,
    tipoEntrega: tipoEntregaPedidoSchema,
    enderecoCep: optionalTextSchema,
    enderecoRua: optionalTextSchema,
    enderecoNumero: optionalTextSchema,
    enderecoBairro: optionalTextSchema,
    enderecoCidade: optionalTextSchema,
    enderecoEstado: optionalTextSchema,
    enderecoUf: optionalTextSchema,
    enderecoComplemento: optionalTextSchema,
    itens: z
      .array(checkoutItemSchema)
      .min(1, "Inclua pelo menos um item no pedido."),
  })
  .superRefine((input, context) => {
    if (input.tipoEntrega !== "DELIVERY") {
      return;
    }

    const camposObrigatorios = [
      ["enderecoCep", input.enderecoCep],
      ["enderecoRua", input.enderecoRua],
      ["enderecoNumero", input.enderecoNumero],
      ["enderecoBairro", input.enderecoBairro],
      ["enderecoCidade", input.enderecoCidade],
      ["enderecoEstado", input.enderecoEstado],
    ] as const;

    for (const [campo, valor] of camposObrigatorios) {
      if (!valor) {
        context.addIssue({
          code: "custom",
          path: [campo],
          message: "Campo obrigatorio para entrega.",
        });
      }
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
