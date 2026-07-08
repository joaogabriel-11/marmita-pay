import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { DbClient } from "./types";

export const TIPO_NOTIFICACAO_ADMIN = {
  PEDIDO_CRIADO: "PEDIDO_CRIADO",
  PAGAMENTO_APROVADO: "PAGAMENTO_APROVADO",
} as const;

export type TipoNotificacaoAdmin =
  (typeof TIPO_NOTIFICACAO_ADMIN)[keyof typeof TIPO_NOTIFICACAO_ADMIN];

export function createNotificacaoAdminRepository(db: DbClient = prisma) {
  return {
    create(data: Prisma.NotificacaoAdminCreateInput) {
      return db.notificacaoAdmin.create({ data });
    },
  };
}

export const notificacaoAdminRepository = createNotificacaoAdminRepository();
