import {
  atualizarZonaEntregaAction,
  criarZonaEntregaAction,
  desativarZonaEntregaAction,
  salvarConfiguracoesAction,
} from "@/app/admin/configuracoes/actions";
import { EnderecoRestauranteFields } from "@/components/admin/endereco-restaurante-fields";
import {
  configuracaoRepository,
  zonaEntregaRepository,
} from "@/lib/repositories";

export const dynamic = "force-dynamic";

type ConfiguracaoAdmin = {
  nomeRestaurante: string;
  modoEntrega: "DELIVERY" | "RETIRADA" | "AMBOS";
  horarioCorte: string;
  pedidosAtivos: boolean;
  motivoFechamento: string | null;
  pedidoMinimo: { toString(): string } | null;
  taxaEntregaPadrao: { toString(): string } | null;
  tempoPreparoMinutos: number | null;
  tempoEntregaMinutos: number | null;
  whatsappContato: string | null;
  enderecoCep: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoEstado: string | null;
  enderecoUf: string | null;
};

type ZonaEntregaAdmin = {
  id: string;
  nome: string;
  taxaEntrega: { toString(): string };
  ativo: boolean;
};

const configuracaoPadrao: ConfiguracaoAdmin = {
  nomeRestaurante: "Marmita Pay",
  modoEntrega: "AMBOS",
  horarioCorte: "23:59",
  pedidosAtivos: true,
  motivoFechamento: null,
  pedidoMinimo: null,
  taxaEntregaPadrao: null,
  tempoPreparoMinutos: null,
  tempoEntregaMinutos: null,
  whatsappContato: null,
  enderecoCep: null,
  enderecoLogradouro: null,
  enderecoNumero: null,
  enderecoComplemento: null,
  enderecoBairro: null,
  enderecoCidade: null,
  enderecoEstado: null,
  enderecoUf: null,
};

export default async function AdminConfiguracoesPage() {
  const [configuracaoBanco, zonasBanco] = await Promise.all([
    configuracaoRepository.get(),
    zonaEntregaRepository.list(),
  ]);

  const configuracao = (configuracaoBanco ??
    configuracaoPadrao) as ConfiguracaoAdmin;
  const zonas = zonasBanco as ZonaEntregaAdmin[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Configuracoes</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Controle atendimento, entrega, horarios e contato do restaurante.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Restaurante e atendimento</h2>
        <form
          action={salvarConfiguracoesAction}
          className="mt-4 grid gap-3 lg:grid-cols-2"
        >
          <label className="grid gap-1 text-sm font-medium">
            Nome do restaurante
            <input
              name="nomeRestaurante"
              defaultValue={configuracao.nomeRestaurante}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Modo de entrega
            <select
              name="modoEntrega"
              defaultValue={configuracao.modoEntrega}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="AMBOS">Entrega e retirada</option>
              <option value="DELIVERY">Somente entrega</option>
              <option value="RETIRADA">Somente retirada</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Horario maximo para pedidos
            <input
              name="horarioCorte"
              type="time"
              defaultValue={configuracao.horarioCorte}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Pedido minimo
            <input
              name="pedidoMinimo"
              defaultValue={configuracao.pedidoMinimo?.toString() ?? ""}
              inputMode="decimal"
              placeholder="Opcional"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Taxa de entrega padrao
            <input
              name="taxaEntregaPadrao"
              defaultValue={configuracao.taxaEntregaPadrao?.toString() ?? ""}
              inputMode="decimal"
              placeholder="Opcional"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            WhatsApp de contato
            <input
              name="whatsappContato"
              defaultValue={configuracao.whatsappContato ?? ""}
              placeholder="11999999999"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Tempo de preparo em minutos
            <input
              name="tempoPreparoMinutos"
              type="number"
              min="1"
              defaultValue={configuracao.tempoPreparoMinutos ?? ""}
              placeholder="Opcional"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Tempo de entrega em minutos
            <input
              name="tempoEntregaMinutos"
              type="number"
              min="1"
              defaultValue={configuracao.tempoEntregaMinutos ?? ""}
              placeholder="Opcional"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <EnderecoRestauranteFields
            enderecoCep={configuracao.enderecoCep}
            enderecoLogradouro={configuracao.enderecoLogradouro}
            enderecoNumero={configuracao.enderecoNumero}
            enderecoComplemento={configuracao.enderecoComplemento}
            enderecoBairro={configuracao.enderecoBairro}
            enderecoCidade={configuracao.enderecoCidade}
            enderecoEstado={configuracao.enderecoEstado}
            enderecoUf={configuracao.enderecoUf}
          />
          <label className="inline-flex items-center gap-2 text-sm font-medium lg:col-span-2">
            <input
              name="pedidosAtivos"
              type="checkbox"
              defaultChecked={configuracao.pedidosAtivos}
            />
            Aceitando pedidos
          </label>
          <label className="grid gap-1 text-sm font-medium lg:col-span-2">
            Motivo quando estiver fechado
            <textarea
              name="motivoFechamento"
              defaultValue={configuracao.motivoFechamento ?? ""}
              className="min-h-20 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Ex: Hoje estamos fechados para manutencao."
            />
          </label>
          <button className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white">
            Salvar configuracoes
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Zonas de entrega</h2>
        <form action={criarZonaEntregaAction} className="mt-4 flex flex-wrap gap-3">
          <input
            name="nome"
            placeholder="Bairro ou regiao"
            className="min-w-56 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            required
          />
          <input
            name="taxaEntrega"
            placeholder="Taxa"
            inputMode="decimal"
            className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            required
          />
          <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium">
            Criar zona
          </button>
        </form>

        <div className="mt-4 space-y-3">
          {zonas.map((zona) => (
            <article
              key={zona.id}
              className={`rounded-lg border border-zinc-200 p-3 ${
                zona.ativo ? "" : "opacity-60"
              }`}
            >
              <form
                action={atualizarZonaEntregaAction}
                className="flex flex-wrap items-center gap-3"
              >
                <input type="hidden" name="id" value={zona.id} />
                <input
                  name="nome"
                  defaultValue={zona.nome}
                  className="min-w-56 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  required
                />
                <input
                  name="taxaEntrega"
                  defaultValue={zona.taxaEntrega.toString()}
                  inputMode="decimal"
                  className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  required
                />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    name="ativo"
                    type="checkbox"
                    defaultChecked={zona.ativo}
                  />
                  Ativa
                </label>
                <button className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white">
                  Salvar
                </button>
              </form>
              <form action={desativarZonaEntregaAction} className="mt-2">
                <input type="hidden" name="id" value={zona.id} />
                <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700">
                  Desativar zona
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
