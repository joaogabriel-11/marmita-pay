import Link from "next/link";
import { pedidoRepository } from "@/lib/repositories";
import { formatMoney } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

type PedidoAdminListItem = {
  id: string;
  codigoPedido: number;
  clienteNome: string;
  clienteTelefone: string;
  status: string;
  valorTotal: Parameters<typeof formatMoney>[0];
  pagamento: {
    status: string;
  } | null;
};

const statusLabels: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  EXPIRADO: "Expirado",
  CANCELADO: "Cancelado",
  CONFIRMADO: "Confirmado",
  EM_PREPARO: "Em preparo",
  PRONTO_PARA_RETIRADA: "Pronto para retirada",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue",
  RETIRADO: "Retirado",
};

export default async function AdminPedidosPage() {
  const pedidos = (await pedidoRepository.list({
    take: 100,
  })) as PedidoAdminListItem[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Acompanhe pagamentos e preparo dos pedidos.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pedidos.map((pedido: PedidoAdminListItem) => (
              <tr key={pedido.id}>
                <td className="px-4 py-3 font-medium">#{pedido.codigoPedido}</td>
                <td className="px-4 py-3">
                  <div>{pedido.clienteNome}</div>
                  <div className="text-xs text-zinc-500">
                    {pedido.clienteTelefone}
                  </div>
                </td>
                <td className="px-4 py-3">{statusLabels[pedido.status]}</td>
                <td className="px-4 py-3">
                  {pedido.pagamento?.status ?? "Sem pagamento"}
                </td>
                <td className="px-4 py-3">{formatMoney(pedido.valorTotal)}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/pedido/${pedido.codigoPedido}`}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
