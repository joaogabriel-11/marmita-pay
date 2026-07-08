"use client";

import { useEffect } from "react";

type CardapioFormBehaviorProps = {
  formId: string;
};

function getPratoId(name: string, prefix: string) {
  return name.startsWith(prefix) ? name.slice(prefix.length) : null;
}

function syncDisponivel(form: HTMLFormElement, pratoId: string) {
  const estoqueInput = form.elements.namedItem(
    `quantidadeDisponivel-${pratoId}`,
  ) as HTMLInputElement | null;
  const disponivelInput = form.elements.namedItem(
    `ativo-${pratoId}`,
  ) as HTMLInputElement | null;
  const permanenteInput = form.elements.namedItem(
    `permanente-${pratoId}`,
  ) as HTMLInputElement | null;

  if (!estoqueInput || !disponivelInput || !permanenteInput) {
    return;
  }

  const estoque = Number(estoqueInput.value);
  const temEstoque = Number.isFinite(estoque) && estoque > 0;

  if (!temEstoque) {
    disponivelInput.checked = false;
    disponivelInput.disabled = true;
    return;
  }

  disponivelInput.disabled = false;

  if (permanenteInput.checked) {
    disponivelInput.checked = true;
  }
}

export function CardapioFormBehavior({ formId }: CardapioFormBehaviorProps) {
  useEffect(() => {
    const form = document.getElementById(formId);

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const syncAll = () => {
      const pratoIds = Array.from(form.elements)
        .filter(
          (element): element is HTMLInputElement =>
            element instanceof HTMLInputElement && element.name === "pratoId",
        )
        .map((element) => element.value);

      for (const pratoId of pratoIds) {
        syncDisponivel(form, pratoId);
      }
    };

    const handleChange = (event: Event) => {
      const target = event.target;

      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const pratoId =
        getPratoId(target.name, "quantidadeDisponivel-") ??
        getPratoId(target.name, "permanente-");

      if (pratoId) {
        syncDisponivel(form, pratoId);
      }
    };

    syncAll();
    form.addEventListener("input", handleChange);
    form.addEventListener("change", handleChange);

    return () => {
      form.removeEventListener("input", handleChange);
      form.removeEventListener("change", handleChange);
    };
  }, [formId]);

  return null;
}
