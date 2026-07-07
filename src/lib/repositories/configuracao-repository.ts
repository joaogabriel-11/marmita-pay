import type { Prisma } from "@prisma/client";
import { CONFIGURACAO_RESTAURANTE_ID } from "@/lib/core/constants";
import prisma from "@/lib/prisma";
import type { DbClient } from "./types";

export function createConfiguracaoRepository(db: DbClient = prisma) {
  return {
    get() {
      return db.configuracaoRestaurante.findUnique({
        where: { id: CONFIGURACAO_RESTAURANTE_ID },
      });
    },

    upsert(data: Prisma.ConfiguracaoRestauranteUncheckedCreateInput) {
      const updateData = { ...data };
      delete updateData.id;

      return db.configuracaoRestaurante.upsert({
        where: { id: CONFIGURACAO_RESTAURANTE_ID },
        update: updateData,
        create: {
          id: CONFIGURACAO_RESTAURANTE_ID,
          ...data,
        },
      });
    },

    update(data: Prisma.ConfiguracaoRestauranteUpdateInput) {
      return db.configuracaoRestaurante.update({
        where: { id: CONFIGURACAO_RESTAURANTE_ID },
        data,
      });
    },
  };
}

export const configuracaoRepository = createConfiguracaoRepository();
