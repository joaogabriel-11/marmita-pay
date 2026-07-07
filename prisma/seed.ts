import "dotenv/config";
import type { Prisma } from "@prisma/client";
import prisma from "../src/lib/prisma";

const categoriasIniciais = [
  { nome: "Marmitas", ordem: 1 },
  { nome: "Bebidas", ordem: 2 },
  { nome: "Sobremesas", ordem: 3 },
  { nome: "Adicionais", ordem: 4 },
];

async function main() {
  const configuracao = await prisma.configuracaoRestaurante.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      nomeRestaurante: "Marmita Pay",
      modoEntrega: "AMBOS",
      horarioCorte: "10:00",
      pedidosAtivos: true,
      pedidoMinimo: "15.00",
      taxaEntregaPadrao: "5.00",
      tempoPreparoMinutos: 30,
      tempoEntregaMinutos: 40,
    },
  });

  const configuracaoDefaults: Prisma.ConfiguracaoRestauranteUpdateInput = {};

  if (configuracao.pedidoMinimo === null) {
    configuracaoDefaults.pedidoMinimo = "15.00";
  }

  if (configuracao.taxaEntregaPadrao === null) {
    configuracaoDefaults.taxaEntregaPadrao = "5.00";
  }

  if (configuracao.tempoPreparoMinutos === null) {
    configuracaoDefaults.tempoPreparoMinutos = 30;
  }

  if (configuracao.tempoEntregaMinutos === null) {
    configuracaoDefaults.tempoEntregaMinutos = 40;
  }

  if (Object.keys(configuracaoDefaults).length > 0) {
    await prisma.configuracaoRestaurante.update({
      where: { id: "default" },
      data: configuracaoDefaults,
    });
  }

  for (const categoria of categoriasIniciais) {
    const existente = await prisma.categoria.findFirst({
      where: { nome: categoria.nome },
    });

    if (existente) {
      await prisma.categoria.update({
        where: { id: existente.id },
        data: { ordem: categoria.ordem, ativo: true },
      });
      continue;
    }

    await prisma.categoria.create({ data: categoria });
  }

  console.log("Seed concluido.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
