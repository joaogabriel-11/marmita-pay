"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSessionOrRedirect } from "@/lib/auth/permissions";
import {
  configuracaoRepository,
  zonaEntregaRepository,
} from "@/lib/repositories";
import {
  configuracaoSchema,
  zonaEntregaSchema,
} from "@/lib/validations";

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function salvarConfiguracoesAction(formData: FormData) {
  await requireAdminSessionOrRedirect();

  const input = configuracaoSchema.parse({
    nomeRestaurante: formData.get("nomeRestaurante"),
    modoEntrega: formData.get("modoEntrega"),
    horarioCorte: formData.get("horarioCorte"),
    pedidosAtivos: getBoolean(formData, "pedidosAtivos"),
    motivoFechamento: formData.get("motivoFechamento"),
    taxaEntregaPadrao: formData.get("taxaEntregaPadrao"),
    pedidoMinimo: formData.get("pedidoMinimo"),
    tempoPreparoMinutos: formData.get("tempoPreparoMinutos") || undefined,
    tempoEntregaMinutos: formData.get("tempoEntregaMinutos") || undefined,
    whatsappContato: formData.get("whatsappContato"),
  });

  await configuracaoRepository.upsert({
    id: "default",
    nomeRestaurante: input.nomeRestaurante,
    modoEntrega: input.modoEntrega,
    horarioCorte: input.horarioCorte,
    pedidosAtivos: input.pedidosAtivos,
    motivoFechamento: input.motivoFechamento,
    taxaEntregaPadrao: input.taxaEntregaPadrao,
    pedidoMinimo: input.pedidoMinimo,
    tempoPreparoMinutos: input.tempoPreparoMinutos,
    tempoEntregaMinutos: input.tempoEntregaMinutos,
    whatsappContato: input.whatsappContato,
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/cardapio");
  revalidatePath("/checkout");
}

export async function criarZonaEntregaAction(formData: FormData) {
  await requireAdminSessionOrRedirect();

  const input = zonaEntregaSchema.parse({
    nome: formData.get("nome"),
    taxaEntrega: formData.get("taxaEntrega"),
    ativo: true,
  });

  await zonaEntregaRepository.create(input);

  revalidatePath("/admin/configuracoes");
  revalidatePath("/checkout");
}

export async function atualizarZonaEntregaAction(formData: FormData) {
  await requireAdminSessionOrRedirect();

  const id = z.string().min(1).parse(formData.get("id"));
  const input = zonaEntregaSchema.parse({
    nome: formData.get("nome"),
    taxaEntrega: formData.get("taxaEntrega"),
    ativo: getBoolean(formData, "ativo"),
  });

  await zonaEntregaRepository.update(id, input);

  revalidatePath("/admin/configuracoes");
  revalidatePath("/checkout");
}

export async function desativarZonaEntregaAction(formData: FormData) {
  await requireAdminSessionOrRedirect();

  const id = z.string().min(1).parse(formData.get("id"));
  await zonaEntregaRepository.deactivate(id);

  revalidatePath("/admin/configuracoes");
  revalidatePath("/checkout");
}
