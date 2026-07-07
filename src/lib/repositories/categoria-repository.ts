import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { DbClient } from "./types";

export function createCategoriaRepository(db: DbClient = prisma) {
  return {
    findById(id: string) {
      return db.categoria.findUnique({ where: { id } });
    },

    findByName(nome: string) {
      return db.categoria.findFirst({ where: { nome } });
    },

    list(params?: { somenteAtivas?: boolean }) {
      return db.categoria.findMany({
        where: params?.somenteAtivas ? { ativo: true } : undefined,
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      });
    },

    create(data: Prisma.CategoriaCreateInput) {
      return db.categoria.create({ data });
    },

    update(id: string, data: Prisma.CategoriaUpdateInput) {
      return db.categoria.update({ where: { id }, data });
    },

    deactivate(id: string) {
      return db.categoria.update({
        where: { id },
        data: { ativo: false },
      });
    },
  };
}

export const categoriaRepository = createCategoriaRepository();
