"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdminSession } from "@/lib/auth/permissions";
import { DomainError } from "@/lib/core/domain-error";
import { atualizarStatusPedido } from "@/lib/services";
import { atualizarStatusPedidoSchema } from "@/lib/validations";

function getOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function atualizarStatusPedidoAction(formData: FormData) {
  await assertAdminSession();

  try {
    const input = atualizarStatusPedidoSchema.parse({
      pedidoId: formData.get("pedidoId"),
      status: formData.get("status"),
      motivoCancelamento: getOptionalString(formData, "motivoCancelamento"),
    });

    await atualizarStatusPedido(input);
    revalidatePath("/admin");
    revalidatePath("/admin/pedidos");
  } catch (error) {
    if (error instanceof DomainError || error instanceof z.ZodError) {
      throw error;
    }

    throw new Error("Nao foi possivel atualizar o status do pedido.");
  }
}
