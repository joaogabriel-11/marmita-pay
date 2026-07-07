import { DomainError } from "@/lib/core/domain-error";
import { isBeforeCutoff } from "@/lib/utils/dates";

export function verificarHorarioCorte(
  horarioCorte: string,
  agora = new Date(),
): boolean {
  return isBeforeCutoff(horarioCorte, agora);
}

export function assertDentroHorarioCorte(
  horarioCorte: string,
  agora = new Date(),
): void {
  if (!verificarHorarioCorte(horarioCorte, agora)) {
    throw new DomainError(
      "HORARIO_CORTE_ENCERRADO",
      "Pedidos encerrados por hoje.",
    );
  }
}
