import { DomainError } from "@/lib/core/domain-error";

export function assertAdmin(isAdmin: boolean): void {
  if (!isAdmin) {
    throw new DomainError(
      "UNAUTHORIZED",
      "Voce precisa estar autenticado como administrador.",
    );
  }
}
