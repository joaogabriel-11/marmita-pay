import type { Prisma } from "@prisma/client";
import type prisma from "@/lib/prisma";

export type DbClient = typeof prisma | Prisma.TransactionClient;
