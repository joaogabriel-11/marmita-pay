import { DomainError } from "@/lib/core/domain-error";
import { getAdminSession } from "./auth";

export function assertAdmin(isAdmin: boolean): void {
  if (!isAdmin) {
    throw new DomainError(
      "UNAUTHORIZED",
      "Voce precisa estar autenticado como administrador.",
    );
  }
}

export async function assertAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    throw new DomainError(
      "UNAUTHORIZED",
      "Voce precisa estar autenticado como administrador.",
    );
  }

  return session;
}
