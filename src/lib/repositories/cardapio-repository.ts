import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { DbClient } from "./types";

export function createCardapioRepository(db: DbClient = prisma) {
  return {
    findById(id: string) {
      return db.cardapioDia.findUnique({
        where: { id },
        include: { prato: { include: { categoria: true } } },
      });
    },

    findByPratoAndDate(pratoId: string, data: Date) {
      return db.cardapioDia.findUnique({
        where: { pratoId_data: { pratoId, data } },
        include: { prato: { include: { categoria: true } } },
      });
    },

    findManyByIds(ids: string[]) {
      return db.cardapioDia.findMany({
        where: { id: { in: ids } },
        include: { prato: { include: { categoria: true } } },
      });
    },

    listByDate(data: Date, params?: { somenteAtivos?: boolean }) {
      return db.cardapioDia.findMany({
        where: {
          OR: [{ data }, { permanente: true }],
          ativo: params?.somenteAtivos ? true : undefined,
        },
        include: { prato: { include: { categoria: true } } },
        orderBy: [
          { destaque: "desc" },
          { permanente: "desc" },
          { ordem: "asc" },
          { prato: { categoria: { ordem: "asc" } } },
          { prato: { nome: "asc" } },
        ],
      });
    },

    findPermanentByPrato(pratoId: string) {
      return db.cardapioDia.findFirst({
        where: { pratoId, permanente: true },
        include: { prato: { include: { categoria: true } } },
      });
    },

    create(data: Prisma.CardapioDiaCreateInput) {
      return db.cardapioDia.create({ data });
    },

    update(id: string, data: Prisma.CardapioDiaUpdateInput) {
      return db.cardapioDia.update({ where: { id }, data });
    },

    incrementQuantidadeVendida(id: string, quantidade: number) {
      return db.cardapioDia.update({
        where: { id },
        data: { quantidadeVendida: { increment: quantidade } },
      });
    },

    deactivate(id: string) {
      return db.cardapioDia.update({
        where: { id },
        data: { ativo: false },
      });
    },
  };
}

export const cardapioRepository = createCardapioRepository();
