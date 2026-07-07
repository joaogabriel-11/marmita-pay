import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { DbClient } from "./types";

export function createAdminRepository(db: DbClient = prisma) {
  return {
    findById(id: string) {
      return db.admin.findUnique({ where: { id } });
    },

    findByEmail(email: string) {
      return db.admin.findUnique({ where: { email } });
    },

    list() {
      return db.admin.findMany({ orderBy: { nome: "asc" } });
    },

    create(data: Prisma.AdminCreateInput) {
      return db.admin.create({ data });
    },

    update(id: string, data: Prisma.AdminUpdateInput) {
      return db.admin.update({ where: { id }, data });
    },
  };
}

export const adminRepository = createAdminRepository();
