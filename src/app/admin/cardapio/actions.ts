"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdminSession } from "@/lib/auth/permissions";
import {
  cardapioRepository,
  pratoRepository,
} from "@/lib/repositories";
import { cardapioDiaSchema } from "@/lib/validations";

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function salvarItemCardapioAction(formData: FormData) {
  await assertAdminSession();

  const input = cardapioDiaSchema.parse({
    pratoId: formData.get("pratoId"),
    data: formData.get("data"),
    precoDoDia: formData.get("precoDoDia"),
    quantidadeDisponivel: formData.get("quantidadeDisponivel"),
    quantidadeVendida: formData.get("quantidadeVendida") ?? 0,
    ativo: getBoolean(formData, "ativo"),
    destaque: getBoolean(formData, "destaque"),
    ordem: formData.get("ordem") ?? 0,
  });

  const prato = await pratoRepository.findById(input.pratoId);

  if (!prato) {
    throw new Error("Prato nao encontrado.");
  }

  const cardapioExistente = await cardapioRepository.findByPratoAndDate(
    input.pratoId,
    input.data,
  );

  const data = {
    precoDoDia: input.precoDoDia,
    quantidadeDisponivel: input.quantidadeDisponivel,
    quantidadeVendida: input.quantidadeVendida,
    ativo: input.ativo,
    destaque: input.destaque,
    ordem: input.ordem,
  };

  if (cardapioExistente) {
    await cardapioRepository.update(cardapioExistente.id, data);
  } else {
    await cardapioRepository.create({
      ...data,
      data: input.data,
      prato: { connect: { id: input.pratoId } },
    });
  }

  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
}

export async function removerItemCardapioAction(formData: FormData) {
  await assertAdminSession();

  const id = z.string().min(1).parse(formData.get("id"));
  await cardapioRepository.deactivate(id);

  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
}
