"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSessionOrRedirect } from "@/lib/auth/permissions";
import {
  configuracaoRepository,
  zonaEntregaRepository,
} from "@/lib/repositories";
import { buscarCoordenadasEndereco } from "@/lib/services";
import {
  configuracaoSchema,
  zonaEntregaSchema,
} from "@/lib/validations";

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function montarEnderecoCompleto(input: {
  enderecoLogradouro?: string;
  enderecoNumero?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoUf?: string;
}) {
  const partes = [
    input.enderecoLogradouro,
    input.enderecoNumero,
    input.enderecoBairro,
    input.enderecoCidade,
    input.enderecoUf,
    "Brasil",
  ];

  if (partes.some((parte) => !parte || parte.trim().length === 0)) {
    return null;
  }

  return partes.join(", ");
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
    enderecoCep: formData.get("enderecoCep"),
    enderecoLogradouro: formData.get("enderecoLogradouro"),
    enderecoNumero: formData.get("enderecoNumero"),
    enderecoComplemento: formData.get("enderecoComplemento"),
    enderecoBairro: formData.get("enderecoBairro"),
    enderecoCidade: formData.get("enderecoCidade"),
    enderecoEstado: formData.get("enderecoEstado"),
    enderecoUf: formData.get("enderecoUf"),
  });
  const enderecoCompleto = montarEnderecoCompleto(input);
  const coordenadas = enderecoCompleto
    ? await buscarCoordenadasEndereco(enderecoCompleto)
    : null;

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
    enderecoCep: input.enderecoCep,
    enderecoLogradouro: input.enderecoLogradouro,
    enderecoNumero: input.enderecoNumero,
    enderecoComplemento: input.enderecoComplemento,
    enderecoBairro: input.enderecoBairro,
    enderecoCidade: input.enderecoCidade,
    enderecoEstado: input.enderecoEstado,
    enderecoUf: input.enderecoUf,
    latitude: coordenadas?.success ? coordenadas.data.latitude : null,
    longitude: coordenadas?.success ? coordenadas.data.longitude : null,
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
