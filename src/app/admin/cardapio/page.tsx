import {
  removerItemCardapioAction,
  salvarItemCardapioAction,
} from "@/app/admin/cardapio/actions";
import {
  cardapioRepository,
  pratoRepository,
} from "@/lib/repositories";
import { getTodayInSaoPaulo } from "@/lib/utils/dates";
import { formatMoney } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ data?: string }>;

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
  precoDoDia: { toString(): string };
  quantidadeDisponivel: number;
  quantidadeVendida: number;
  ativo: boolean;
  destaque: boolean;
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
  const itensPorPrato = new Map(
    (itensCardapio as ItemCardapioAdmin[]).map((item) => [item.pratoId, item]),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Cardapio do dia</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Escolha quais pratos ficam disponiveis, preco e quantidade para venda.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <form className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm font-medium">
            Data
            <input
              type="date"
              name="data"
              defaultValue={dataSelecionada}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white">
            Ver cardapio
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {pratosAdmin.map((prato) => {
          const item = itensPorPrato.get(prato.id);
          const disponivel = item?.ativo ?? false;

          return (
            <article
              key={prato.id}
              className={`rounded-lg border border-zinc-200 bg-white p-4 ${
                disponivel ? "" : "opacity-75"
              }`}
            >
              <form
                action={salvarItemCardapioAction}
                className="grid gap-3 lg:grid-cols-[1fr_140px_140px_100px_120px]"
              >
                <input type="hidden" name="pratoId" value={prato.id} />
                <input type="hidden" name="data" value={dataSelecionada} />
                <input
                  type="hidden"
                  name="quantidadeVendida"
                  value={item?.quantidadeVendida ?? 0}
                />
                <div>
                  <strong>{prato.nome}</strong>
                  <p className="text-sm text-zinc-500">
                    {prato.categoria.nome} · base{" "}
                    {formatMoney(prato.precoBase.toString())}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{prato.descricao}</p>
                </div>
                <label className="grid gap-1 text-sm">
                  Preco do dia
                  <input
                    name="precoDoDia"
                    defaultValue={
                      item?.precoDoDia.toString() ?? prato.precoBase.toString()
                    }
                    inputMode="decimal"
                    className="rounded-md border border-zinc-300 px-3 py-2"
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Quantidade
                  <input
                    name="quantidadeDisponivel"
                    type="number"
                    min="1"
                    defaultValue={item?.quantidadeDisponivel ?? 10}
                    className="rounded-md border border-zinc-300 px-3 py-2"
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Ordem
                  <input
                    name="ordem"
                    type="number"
                    min="0"
                    defaultValue={item?.ordem ?? 0}
                    className="rounded-md border border-zinc-300 px-3 py-2"
                  />
                </label>
                <div className="grid gap-2 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      name="ativo"
                      type="checkbox"
                      defaultChecked={disponivel}
                    />
                    Disponivel
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      name="destaque"
                      type="checkbox"
                      defaultChecked={item?.destaque ?? false}
                    />
                    Destaque
                  </label>
                  <button className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white">
                    Salvar
                  </button>
                </div>
              </form>
              {item ? (
                <form action={removerItemCardapioAction} className="mt-3">
                  <input type="hidden" name="id" value={item.id} />
                  <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium">
                    Remover do dia
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
