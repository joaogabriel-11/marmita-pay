"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSessionOrRedirect } from "@/lib/auth/permissions";
import {
  cardapioRepository,
  pratoRepository,
} from "@/lib/repositories";
import { cardapioDiaSchema } from "@/lib/validations";

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function getAtivoNormalizado(params: {
  ativo: boolean;
  permanente: boolean;
  estoqueRestante: FormDataEntryValue | null;
}) {
  const quantidade = Number(params.estoqueRestante);

  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return false;
  }

  if (params.permanente) {
    return true;
  }

  return params.ativo;
}

function getQuantidadeDisponivelTotal(params: {
  estoqueRestante: FormDataEntryValue | null;
  quantidadeVendida: FormDataEntryValue | number | null;
}) {
  const estoqueRestante = Number(params.estoqueRestante);
  const quantidadeVendida = Number(params.quantidadeVendida);

  return (
    (Number.isFinite(estoqueRestante) ? estoqueRestante : 0) +
    (Number.isFinite(quantidadeVendida) ? quantidadeVendida : 0)
  );
}

async function salvarItemCardapio(
  input: z.infer<typeof cardapioDiaSchema>,
  itemId?: string,
) {
  const prato = await pratoRepository.findById(input.pratoId);

  if (!prato) {
    throw new Error("Prato nao encontrado.");
  }

  const cardapioExistente = itemId
    ? await cardapioRepository.findById(itemId)
    : input.permanente
      ? await cardapioRepository.findPermanentByPrato(input.pratoId)
      : await cardapioRepository.findByPratoAndDate(input.pratoId, input.data);

  const data = {
    precoDoDia: input.precoDoDia,
    quantidadeDisponivel: input.quantidadeDisponivel,
    quantidadeVendida: input.quantidadeVendida,
    ativo: input.ativo,
    destaque: input.destaque,
    permanente: input.permanente,
    ordem: input.ordem,
  };

  if (cardapioExistente) {
    await cardapioRepository.update(cardapioExistente.id, data);
    return;
  }

  await cardapioRepository.create({
    ...data,
    data: input.data,
    prato: { connect: { id: input.pratoId } },
  });
}

export async function salvarItemCardapioAction(formData: FormData) {
  await requireAdminSessionOrRedirect();

  const permanente = getBoolean(formData, "permanente");
  const estoqueRestante = formData.get("quantidadeDisponivel");
  const quantidadeVendida = formData.get("quantidadeVendida") ?? 0;
  const input = cardapioDiaSchema.parse({
    pratoId: formData.get("pratoId"),
    data: formData.get("data"),
    precoDoDia: formData.get("precoDoDia"),
    quantidadeDisponivel: getQuantidadeDisponivelTotal({
      estoqueRestante,
      quantidadeVendida,
    }),
    quantidadeVendida,
    ativo: getAtivoNormalizado({
      ativo: getBoolean(formData, "ativo"),
      permanente,
      estoqueRestante,
    }),
    destaque: getBoolean(formData, "destaque"),
    permanente,
    ordem: formData.get("ordem") ?? 0,
  });
  const itemId = getOptionalString(formData, "itemId");

  await salvarItemCardapio(input, itemId);

  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
}

export async function salvarCardapioAction(formData: FormData) {
  await requireAdminSessionOrRedirect();

  const pratoIds = formData.getAll("pratoId").filter((value): value is string => (
    typeof value === "string" && value.trim().length > 0
  ));
  const dataCardapio = formData.get("data");

  for (const pratoId of pratoIds) {
    const itemId = getOptionalString(formData, `itemId-${pratoId}`);
    const estoqueRestante = formData.get(
      `quantidadeDisponivel-${pratoId}`,
    );
    const quantidadeVendida =
      formData.get(`quantidadeVendida-${pratoId}`) ?? 0;
    const destaque = getBoolean(formData, `destaque-${pratoId}`);
    const permanente = getBoolean(formData, `permanente-${pratoId}`);
    const ativo = getAtivoNormalizado({
      ativo: getBoolean(formData, `ativo-${pratoId}`),
      permanente,
      estoqueRestante,
    });

    if (!itemId && !ativo && !destaque && !permanente) {
      continue;
    }

    const input = cardapioDiaSchema.parse({
      pratoId,
      data: dataCardapio,
      precoDoDia: formData.get(`precoDoDia-${pratoId}`),
      quantidadeDisponivel: getQuantidadeDisponivelTotal({
        estoqueRestante,
        quantidadeVendida,
      }),
      quantidadeVendida,
      ativo,
      destaque,
      permanente,
      ordem: formData.get(`ordem-${pratoId}`) ?? 0,
    });

    await salvarItemCardapio(input, itemId);
  }

  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
}

export async function removerItemCardapioAction(formData: FormData) {
  await requireAdminSessionOrRedirect();

  const id = z.string().min(1).parse(formData.get("id"));
  await cardapioRepository.deactivate(id);

  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
}
