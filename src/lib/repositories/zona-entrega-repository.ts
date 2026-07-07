import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { DbClient } from "./types";

export function createZonaEntregaRepository(db: DbClient = prisma) {
  return {
    findById(id: string) {
      return db.zonaEntrega.findUnique({ where: { id } });
    },

    findActiveByName(nome: string) {
      return db.zonaEntrega.findFirst({
        where: {
          nome: { equals: nome, mode: "insensitive" },
          ativo: true,
        },
      });
    },

    list(params?: { somenteAtivas?: boolean }) {
      return db.zonaEntrega.findMany({
        where: params?.somenteAtivas ? { ativo: true } : undefined,
        orderBy: { nome: "asc" },
      });
    },

    create(data: Prisma.ZonaEntregaCreateInput) {
      return db.zonaEntrega.create({ data });
    },

    update(id: string, data: Prisma.ZonaEntregaUpdateInput) {
      return db.zonaEntrega.update({ where: { id }, data });
    },

    deactivate(id: string) {
      return db.zonaEntrega.update({
        where: { id },
        data: { ativo: false },
      });
    },
  };
}

export const zonaEntregaRepository = createZonaEntregaRepository();
