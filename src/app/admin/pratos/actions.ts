"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdminSession } from "@/lib/auth/permissions";
import {
  categoriaRepository,
  pratoRepository,
} from "@/lib/repositories";
import { categoriaSchema, pratoSchema } from "@/lib/validations";

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function criarPratoAction(formData: FormData) {
  await assertAdminSession();

  const input = pratoSchema.parse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    fotoUrl: formData.get("fotoUrl"),
    categoriaId: formData.get("categoriaId"),
    precoBase: formData.get("precoBase"),
    ativo: getBoolean(formData, "ativo"),
  });

  await pratoRepository.create({
    nome: input.nome,
    descricao: input.descricao,
    fotoUrl: input.fotoUrl,
    precoBase: input.precoBase,
    ativo: input.ativo,
    categoria: { connect: { id: input.categoriaId } },
  });

  revalidatePath("/admin/pratos");
  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
}

export async function atualizarPratoAction(formData: FormData) {
  await assertAdminSession();

  const id = z.string().min(1).parse(formData.get("id"));
  const input = pratoSchema.parse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    fotoUrl: formData.get("fotoUrl"),
    categoriaId: formData.get("categoriaId"),
    precoBase: formData.get("precoBase"),
    ativo: getBoolean(formData, "ativo"),
  });

  await pratoRepository.update(id, {
    nome: input.nome,
    descricao: input.descricao,
    fotoUrl: input.fotoUrl,
    precoBase: input.precoBase,
    ativo: input.ativo,
    categoria: { connect: { id: input.categoriaId } },
  });

  revalidatePath("/admin/pratos");
  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
}

export async function excluirPratoAction(formData: FormData) {
  await assertAdminSession();

  const id = z.string().min(1).parse(formData.get("id"));

  try {
    await pratoRepository.delete(id);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      throw new Error(
        "Nao foi possivel excluir este prato porque ele ja esta vinculado a um cardapio ou pedido.",
      );
    }

    throw error;
  }

  revalidatePath("/admin/pratos");
  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
}

export async function criarCategoriaAction(formData: FormData) {
  await assertAdminSession();

  const input = categoriaSchema.parse({
    nome: formData.get("nome"),
    ordem: formData.get("ordem"),
    ativo: true,
  });

  await categoriaRepository.create(input);

  revalidatePath("/admin/pratos");
  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
}
