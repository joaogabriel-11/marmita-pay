import { pedidoRepository } from "@/lib/repositories";
import { formatMoney } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

type PedidoDashboard = {
  status: string;
  valorTotal: {
    toString(): string;
  };
};

const statusLabels: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  CONFIRMADO: "Confirmados",
  EM_PREPARO: "Em preparo",
  ENTREGUE: "Entregues",
};

export default async function AdminDashboardPage() {
  const pedidos = (await pedidoRepository.list({ take: 50 })) as PedidoDashboard[];
  const totalConfirmado = pedidos
    .filter((pedido) => pedido.status !== "CANCELADO" && pedido.status !== "EXPIRADO")
    .reduce((total, pedido) => total + Number(pedido.valorTotal), 0);

  const cards = ["AGUARDANDO_PAGAMENTO", "CONFIRMADO", "EM_PREPARO", "ENTREGUE"].map(
    (status: string) => ({
      status,
      label: statusLabels[status],
      value: pedidos.filter((pedido: PedidoDashboard) => pedido.status === status)
        .length,
    }),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Visao rapida dos pedidos recentes.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card: { status: string; label: string; value: number }) => (
          <article
            key={card.status}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <p className="text-sm text-zinc-500">{card.label}</p>
            <strong className="mt-2 block text-3xl">{card.value}</strong>
          </article>
        ))}
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm text-zinc-500">Total em pedidos recentes</p>
        <strong className="mt-2 block text-2xl">
          {formatMoney(totalConfirmado)}
        </strong>
      </section>
    </div>
  );
}
