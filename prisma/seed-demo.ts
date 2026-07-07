import "dotenv/config";
import type { Categoria } from "@prisma/client";
import prisma from "../src/lib/prisma";

function getTodayDateOnlyInSaoPaulo(date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return new Date(
    `${getPart("year")}-${getPart("month")}-${getPart("day")}T00:00:00.000Z`,
  );
}

const categorias = [
  { nome: "Marmitas", ordem: 1 },
  { nome: "Bebidas", ordem: 2 },
  { nome: "Sobremesas", ordem: 3 },
  { nome: "Adicionais", ordem: 4 },
];

const pratos = [
  {
    nome: "Marmita de Frango Grelhado",
    descricao: "Arroz, feijao, frango grelhado, legumes e salada fresca.",
    categoria: "Marmitas",
    precoBase: "24.90",
    quantidadeDisponivel: 18,
    destaque: true,
    ordem: 1,
  },
  {
    nome: "Marmita de Carne de Panela",
    descricao: "Arroz, feijao, carne de panela, pure de batata e farofa.",
    categoria: "Marmitas",
    precoBase: "27.90",
    quantidadeDisponivel: 12,
    destaque: true,
    ordem: 2,
  },
  {
    nome: "Marmita Vegetariana",
    descricao: "Arroz integral, grao-de-bico, legumes assados e salada.",
    categoria: "Marmitas",
    precoBase: "23.90",
    quantidadeDisponivel: 8,
    destaque: false,
    ordem: 3,
  },
  {
    nome: "Coca-Cola Lata",
    descricao: "Refrigerante lata 350ml.",
    categoria: "Bebidas",
    precoBase: "6.00",
    quantidadeDisponivel: 30,
    destaque: false,
    ordem: 1,
  },
  {
    nome: "Agua Mineral",
    descricao: "Garrafa 500ml sem gas.",
    categoria: "Bebidas",
    precoBase: "4.00",
    quantidadeDisponivel: 25,
    destaque: false,
    ordem: 2,
  },
  {
    nome: "Pudim Caseiro",
    descricao: "Fatia individual de pudim de leite condensado.",
    categoria: "Sobremesas",
    precoBase: "8.50",
    quantidadeDisponivel: 10,
    destaque: false,
    ordem: 1,
  },
];

const zonasEntrega = [
  { nome: "Centro", taxaEntrega: "5.00" },
  { nome: "Zona Norte", taxaEntrega: "8.00" },
  { nome: "Zona Sul", taxaEntrega: "10.00" },
];

async function upsertCategoria(categoria: (typeof categorias)[number]) {
  const existente = await prisma.categoria.findFirst({
    where: { nome: categoria.nome },
  });

  if (existente) {
    return prisma.categoria.update({
      where: { id: existente.id },
      data: { ordem: categoria.ordem, ativo: true },
    });
  }

  return prisma.categoria.create({ data: { ...categoria, ativo: true } });
}

async function main() {
  await prisma.configuracaoRestaurante.upsert({
    where: { id: "default" },
    update: {
      nomeRestaurante: "Marmita Pay Demo",
      modoEntrega: "AMBOS",
      horarioCorte: "23:59",
      pedidosAtivos: true,
      motivoFechamento: null,
      pedidoMinimo: "15.00",
      taxaEntregaPadrao: "5.00",
      tempoPreparoMinutos: 30,
      tempoEntregaMinutos: 45,
      whatsappContato: "5514999999999",
    },
    create: {
      id: "default",
      nomeRestaurante: "Marmita Pay Demo",
      modoEntrega: "AMBOS",
      horarioCorte: "23:59",
      pedidosAtivos: true,
      pedidoMinimo: "15.00",
      taxaEntregaPadrao: "5.00",
      tempoPreparoMinutos: 30,
      tempoEntregaMinutos: 45,
      whatsappContato: "5514999999999",
    },
  });

  for (const categoria of categorias) {
    await upsertCategoria(categoria);
  }

  const categoriasBanco = await prisma.categoria.findMany();
  const categoriasPorNome = new Map<string, Categoria>(
    categoriasBanco.map((categoria) => [categoria.nome, categoria]),
  );
  const data = getTodayDateOnlyInSaoPaulo();

  for (const pratoDemo of pratos) {
    const categoria = categoriasPorNome.get(pratoDemo.categoria);

    if (!categoria) {
      throw new Error(`Categoria nao encontrada: ${pratoDemo.categoria}`);
    }

    const pratoExistente = await prisma.prato.findFirst({
      where: { nome: pratoDemo.nome },
    });
    const prato = pratoExistente
      ? await prisma.prato.update({
          where: { id: pratoExistente.id },
          data: {
            descricao: pratoDemo.descricao,
            precoBase: pratoDemo.precoBase,
            categoriaId: categoria.id,
            ativo: true,
          },
        })
      : await prisma.prato.create({
          data: {
            nome: pratoDemo.nome,
            descricao: pratoDemo.descricao,
            precoBase: pratoDemo.precoBase,
            categoriaId: categoria.id,
            ativo: true,
          },
        });

    await prisma.cardapioDia.upsert({
      where: {
        pratoId_data: {
          pratoId: prato.id,
          data,
        },
      },
      update: {
        precoDoDia: pratoDemo.precoBase,
        quantidadeDisponivel: pratoDemo.quantidadeDisponivel,
        ativo: true,
        destaque: pratoDemo.destaque,
        ordem: pratoDemo.ordem,
      },
      create: {
        pratoId: prato.id,
        data,
        precoDoDia: pratoDemo.precoBase,
        quantidadeDisponivel: pratoDemo.quantidadeDisponivel,
        quantidadeVendida: 0,
        ativo: true,
        destaque: pratoDemo.destaque,
        ordem: pratoDemo.ordem,
      },
    });
  }

  for (const zona of zonasEntrega) {
    const existente = await prisma.zonaEntrega.findFirst({
      where: { nome: zona.nome },
    });

    if (existente) {
      await prisma.zonaEntrega.update({
        where: { id: existente.id },
        data: { taxaEntrega: zona.taxaEntrega, ativo: true },
      });
      continue;
    }

    await prisma.zonaEntrega.create({
      data: { ...zona, ativo: true },
    });
  }

  console.log("Seed demo concluido.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
