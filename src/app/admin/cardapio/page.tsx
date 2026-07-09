import { salvarCardapioAction } from "@/app/admin/cardapio/actions";
import { CardapioFormBehavior } from "@/components/admin/cardapio-form-behavior";
import {
  cardapioRepository,
  pratoRepository,
} from "@/lib/repositories";
import { getTodayInSaoPaulo } from "@/lib/utils/dates";
import { formatMoney } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ data?: string; saved?: string }>;

type PratoCardapioAdmin = {
  id: string;
  nome: string;
  descricao: string;
  precoBase: { toString(): string };
  categoria: { nome: string };
};

type ItemCardapioAdmin = {
  id: string;
  pratoId: string;
  data: Date;
  precoDoDia: { toString(): string };
  quantidadeDisponivel: number;
  quantidadeVendida: number;
  ativo: boolean;
  destaque: boolean;
  permanente: boolean;
  ordem: number;
};

function dateOnlyFromInput(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function isDateInput(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default async function AdminCardapioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const dataSelecionada = isDateInput(params.data)
    ? params.data
    : getTodayInSaoPaulo();
  const dataCardapio = dateOnlyFromInput(dataSelecionada);

  const [pratos, itensCardapio] = await Promise.all([
    pratoRepository.list({ somenteAtivos: true }),
    cardapioRepository.listByDate(dataCardapio),
  ]);

  const pratosAdmin = pratos as PratoCardapioAdmin[];
  const itensPorPrato = new Map<string, ItemCardapioAdmin>();

  for (const item of itensCardapio as ItemCardapioAdmin[]) {
    const itemAtual = itensPorPrato.get(item.pratoId);
    const itemDaData =
      item.data.toISOString().slice(0, 10) === dataSelecionada;
    const itemAtualDaData =
      itemAtual?.data.toISOString().slice(0, 10) === dataSelecionada;

    if (!itemAtual || itemDaData || !itemAtualDaData) {
      itensPorPrato.set(item.pratoId, item);
    }
  }

  const categorias = Array.from(
    new Set(pratosAdmin.map((prato) => prato.categoria.nome)),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">
            Cardapio do dia
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Escolha os itens vendidos na data selecionada. Para bebidas,
            sobremesas fixas ou outros produtos recorrentes, marque sempre no
            cardapio.
          </p>
        </div>

        <form className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-white p-3">
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Data
            <input
              type="date"
              name="data"
              defaultValue={dataSelecionada}
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
            />
          </label>
          <button className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white">
            Ver cardapio
          </button>
        </form>
      </div>

      <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Itens permanentes aparecem todos os dias enquanto estiverem ativos. Se o
        estoque chegar a zero, o cliente ve apenas como indisponivel.
      </section>

      <form
        id="cardapio-admin-form"
        action={salvarCardapioAction}
        className="space-y-8"
      >
        <CardapioFormBehavior
          formId="cardapio-admin-form"
          showSuccess={params.saved === "1"}
        />
        <input type="hidden" name="data" value={dataSelecionada} />

        {categorias.map((categoria) => (
          <section key={categoria} className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-950">
              {categoria}
            </h2>

            <div className="grid gap-4 xl:grid-cols-2">
              {pratosAdmin
                .filter((prato) => prato.categoria.nome === categoria)
                .map((prato) => {
                  const item = itensPorPrato.get(prato.id);
                  const disponivel = item?.ativo ?? false;
                  const permanente = item?.permanente ?? false;
                  const estoqueRestante =
                    (item?.quantidadeDisponivel ?? 0) -
                    (item?.quantidadeVendida ?? 0);

                  return (
                    <article
                      key={prato.id}
                      className={`rounded-lg border bg-white p-4 shadow-sm ${
                        disponivel
                          ? "border-zinc-200"
                          : "border-zinc-200 opacity-80"
                        }`}
                    >
                      <div className="space-y-4">
                        <input type="hidden" name="pratoId" value={prato.id} />
                        <input
                          type="hidden"
                          name={`quantidadeVendida-${prato.id}`}
                          value={item?.quantidadeVendida ?? 0}
                        />
                        {item ? (
                          <input
                            type="hidden"
                            name={`itemId-${prato.id}`}
                            value={item.id}
                          />
                        ) : null}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-zinc-950">
                                {prato.nome}
                              </h3>
                              {permanente ? (
                                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                  Permanente
                                </span>
                              ) : null}
                              {item ? (
                                <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                                  Em uso
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-zinc-500">
                              Base {formatMoney(prato.precoBase.toString())}
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-600">
                              {prato.descricao}
                            </p>
                          </div>

                          {item?.quantidadeVendida ? (
                            <div className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                              Vendidos:{" "}
                              <strong className="text-zinc-950">
                                {item.quantidadeVendida}
                              </strong>
                            </div>
                          ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <label className="grid gap-1 text-sm font-medium text-zinc-800">
                            Preco de venda
                            <input
                              name={`precoDoDia-${prato.id}`}
                              defaultValue={
                                item?.precoDoDia.toString() ??
                                prato.precoBase.toString()
                              }
                              inputMode="decimal"
                              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                              required
                            />
                          </label>

                          <label className="grid gap-1 text-sm font-medium text-zinc-800">
                            Estoque
                            <input
                              name={`quantidadeDisponivel-${prato.id}`}
                              type="number"
                              min="0"
                              defaultValue={Math.max(estoqueRestante, 0)}
                              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                              required
                            />
                          </label>

                          <label className="grid gap-1 text-sm font-medium text-zinc-800">
                            Ordem
                            <input
                              name={`ordem-${prato.id}`}
                              type="number"
                              min="0"
                              defaultValue={item?.ordem ?? 0}
                              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                            />
                          </label>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-4 text-sm text-zinc-700">
                            <label className="inline-flex items-center gap-2">
                              <input
                                name={`ativo-${prato.id}`}
                                type="checkbox"
                                defaultChecked={disponivel}
                                className="size-4 rounded border-zinc-300"
                              />
                              Disponivel
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                name={`destaque-${prato.id}`}
                                type="checkbox"
                                defaultChecked={item?.destaque ?? false}
                                className="size-4 rounded border-zinc-300"
                              />
                              Destaque
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                name={`permanente-${prato.id}`}
                                type="checkbox"
                                defaultChecked={permanente}
                                className="size-4 rounded border-zinc-300"
                              />
                              Sempre no cardapio
                            </label>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>
        ))}

        <div className="sticky bottom-4 z-10 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600">
              Revise as alteracoes do cardapio antes de confirmar.
            </p>
            <button className="rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              Salvar alteracoes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
