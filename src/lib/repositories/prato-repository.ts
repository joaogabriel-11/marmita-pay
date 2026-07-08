import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { DbClient } from "./types";

export function createPratoRepository(db: DbClient = prisma) {
  return {
    findById(id: string) {
      return db.prato.findUnique({
        where: { id },
        include: { categoria: true },
      });
    },

    list(params?: { categoriaId?: string; somenteAtivos?: boolean }) {
      return db.prato.findMany({
        where: {
          categoriaId: params?.categoriaId,
          ativo: params?.somenteAtivos ? true : undefined,
        },
        include: { categoria: true },
        orderBy: [{ categoria: { ordem: "asc" } }, { nome: "asc" }],
      });
    },

    create(data: Prisma.PratoCreateInput) {
      return db.prato.create({ data });
    },

    update(id: string, data: Prisma.PratoUpdateInput) {
      return db.prato.update({ where: { id }, data });
    },

    deactivate(id: string) {
      return db.prato.update({
        where: { id },
        data: { ativo: false },
      });
    },

    delete(id: string) {
      return db.prato.delete({ where: { id } });
    },
  };
}

export const pratoRepository = createPratoRepository();
