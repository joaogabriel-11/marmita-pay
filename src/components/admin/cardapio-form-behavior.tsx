"use client";

import { useEffect, useState } from "react";

type CardapioFormBehaviorProps = {
  formId: string;
  showSuccess?: boolean;
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

export function CardapioFormBehavior({
  formId,
  showSuccess = false,
}: CardapioFormBehaviorProps) {
  const [isSuccessVisible, setIsSuccessVisible] = useState(showSuccess);

  useEffect(() => {
    if (!showSuccess) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("saved");
    window.history.replaceState(null, "", url.toString());
  }, [showSuccess]);

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

  if (!isSuccessVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/20 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 text-center shadow-xl">
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-emerald-50 text-2xl font-semibold text-emerald-700">
          OK
        </div>
        <h2 className="mt-4 text-lg font-semibold text-zinc-950">
          Cardapio atualizado com sucesso
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          As alteracoes ja estao disponiveis para os clientes.
        </p>
        <button
          type="button"
          onClick={() => setIsSuccessVisible(false)}
          className="mt-5 w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          OK
        </button>
      </div>
    </div>
  );
}
