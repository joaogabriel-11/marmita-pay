"use client";

import { uploadPresigned } from "@vercel/blob/client";
import { useMemo, useState, type ChangeEvent } from "react";
import {
  atualizarPratoAction,
  criarCategoriaAction,
  criarPratoAction,
  excluirPratoAction,
} from "@/app/admin/pratos/actions";
import { formatMoney } from "@/lib/utils/money";

export type CategoriaPratosManager = {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
};

export type PratoPratosManager = {
  id: string;
  nome: string;
  descricao: string;
  fotoUrl: string | null;
  precoBase: string;
  ativo: boolean;
  categoriaId: string;
  categoriaNome: string;
};

type PratosManagerProps = {
  categorias: CategoriaPratosManager[];
  pratos: PratoPratosManager[];
};

type ModalState =
  | { mode: "create"; prato?: never }
  | { mode: "edit"; prato: PratoPratosManager };

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L9.38 17.273a4.5 4.5 0 0 1-1.897 1.13L4 19.5l1.098-3.483a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M19.228 5.79 18.16 19.673A2.25 2.25 0 0 1 15.916 21.75H8.084A2.25 2.25 0 0 1 5.84 19.673L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .563c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function PratoModal({
  categorias,
  modal,
  onClose,
}: {
  categorias: CategoriaPratosManager[];
  modal: ModalState;
  onClose: () => void;
}) {
  const prato = modal.mode === "edit" ? modal.prato : undefined;
  const title = modal.mode === "edit" ? "Editar prato" : "Novo prato";
  const action = modal.mode === "edit" ? atualizarPratoAction : criarPratoAction;
  const [fotoUrl, setFotoUrl] = useState(prato?.fotoUrl ?? "");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(formData: FormData) {
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      await action(formData);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o prato.";

      setSubmitMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadStatus("error");
      setUploadMessage("Envie uma imagem JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadStatus("error");
      setUploadMessage("A imagem deve ter no maximo 10MB.");
      event.target.value = "";
      return;
    }

    setUploadStatus("uploading");
    setUploadMessage("Enviando imagem...");

    try {
      const blob = await uploadPresigned(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/pratos/upload-imagem",
      });

      setFotoUrl(blob.url);
      setUploadStatus("success");
      setUploadMessage("Imagem enviada. URL preenchida automaticamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar a imagem.";

      setUploadStatus("error");
      setUploadMessage(message);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium"
          >
            Fechar
          </button>
        </div>
        <form action={handleSave} className="grid gap-4 p-5 md:grid-cols-2">
          {prato ? <input type="hidden" name="id" value={prato.id} /> : null}
          <label className="grid gap-1 text-sm font-medium">
            Titulo
            <input
              name="nome"
              defaultValue={prato?.nome ?? ""}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Categoria
            <select
              name="categoriaId"
              defaultValue={prato?.categoriaId ?? ""}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Selecione</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Preco
            <input
              name="precoBase"
              defaultValue={prato?.precoBase ?? ""}
              inputMode="decimal"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            URL da foto
            <input
              name="fotoUrl"
              value={fotoUrl}
              onChange={(event) => setFotoUrl(event.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            Enviar imagem
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFotoUpload}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              disabled={uploadStatus === "uploading"}
            />
          </label>
          {uploadMessage ? (
            <p
              className={`text-sm md:col-span-2 ${
                uploadStatus === "error" ? "text-red-700" : "text-zinc-600"
              }`}
            >
              {uploadMessage}
            </p>
          ) : null}
          {submitMessage ? (
            <p className="text-sm text-red-700 md:col-span-2">
              {submitMessage}
            </p>
          ) : null}
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            Descricao
            <textarea
              name="descricao"
              defaultValue={prato?.descricao ?? ""}
              className="min-h-28 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input
              name="ativo"
              type="checkbox"
              defaultChecked={prato?.ativo ?? true}
            />
            Prato ativo
          </label>
          <div className="flex justify-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || uploadStatus === "uploading"}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PratosManager({ categorias, pratos }: PratosManagerProps) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const pratosOrdenados = useMemo(
    () =>
      [...pratos].sort((a, b) => {
        if (a.ativo !== b.ativo) {
          return a.ativo ? -1 : 1;
        }

        return a.nome.localeCompare(b.nome, "pt-BR");
      }),
    [pratos],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pratos</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Cadastre marmitas, bebidas, sobremesas e adicionais do catalogo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
          Novo +
        </button>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pratosOrdenados.map((prato) => (
          <article
            key={prato.id}
            className={`overflow-hidden rounded-lg border border-zinc-200 bg-white ${
              prato.ativo ? "" : "opacity-60"
            }`}
          >
            <div
              className="h-32 bg-zinc-100"
              style={
                prato.fotoUrl
                  ? {
                      backgroundImage: `url(${prato.fotoUrl})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }
                  : undefined
              }
            />
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{prato.nome}</h2>
                  <p className="text-sm text-zinc-500">{prato.categoriaNome}</p>
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    prato.ativo
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {prato.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="line-clamp-3 min-h-16 text-sm text-zinc-600">
                {prato.descricao}
              </p>
              <div className="flex items-center justify-between gap-3">
                <strong>{formatMoney(prato.precoBase)}</strong>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModal({ mode: "edit", prato })}
                    className="grid h-9 w-9 place-items-center rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
                    aria-label={`Editar ${prato.nome}`}
                    title="Editar"
                  >
                    <PencilIcon />
                  </button>
                  <form action={excluirPratoAction}>
                    <input type="hidden" name="id" value={prato.id} />
                    <button
                      className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                      aria-label={`Excluir ${prato.nome}`}
                      title="Excluir"
                      onClick={(event) => {
                        if (
                          !window.confirm(
                            `Excluir o prato "${prato.nome}" permanentemente?`,
                          )
                        ) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Categorias</h2>
        <form action={criarCategoriaAction} className="mt-4 flex flex-wrap gap-3">
          <label className="grid gap-1 text-sm font-medium">
            Nome
            <input
              name="nome"
              placeholder="Nova categoria"
              className="min-w-56 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Ordem
            <input
              name="ordem"
              type="number"
              min="0"
              defaultValue="0"
              className="w-28 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end">
            <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium">
              Criar categoria
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-zinc-500">
          Ordem define a posicao da categoria no cardapio. Numeros menores
          aparecem primeiro.
        </p>
      </section>

      {modal ? (
        <PratoModal
          categorias={categorias}
          modal={modal}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}
