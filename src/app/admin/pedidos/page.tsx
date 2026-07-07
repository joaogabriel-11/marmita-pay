import {
  AdminOrdersRealtimeTable,
  type PedidoAdminRealtimeItem,
} from "@/components/admin/admin-orders-realtime-table";
import { pedidoRepository } from "@/lib/repositories";
import { formatMoney } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

type PedidoAdminListItem = {
  id: string;
  codigoPedido: number;
  clienteNome: string;
  clienteTelefone: string;
  status: string;
  tipoEntrega: "DELIVERY" | "RETIRADA";
  valorTotal: Parameters<typeof formatMoney>[0];
  pagamento: {
    status: string;
  } | null;
};

export default async function AdminPedidosPage() {
  const pedidosBanco = (await pedidoRepository.list({
    take: 100,
  })) as PedidoAdminListItem[];
  const pedidos: PedidoAdminRealtimeItem[] = pedidosBanco.map(
    (pedido: PedidoAdminListItem) => ({
      id: pedido.id,
      codigoPedido: pedido.codigoPedido,
      clienteNome: pedido.clienteNome,
      clienteTelefone: pedido.clienteTelefone,
      status: pedido.status,
      tipoEntrega: pedido.tipoEntrega,
      valorTotal: pedido.valorTotal.toString(),
      valorTotalFormatado: formatMoney(pedido.valorTotal),
      pagamentoStatus: pedido.pagamento?.status ?? "PENDENTE",
    }),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Acompanhe pagamentos e preparo dos pedidos.
        </p>
      </div>

      <AdminOrdersRealtimeTable
        initialPedidos={pedidos}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
        supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}
        restauranteId={null}
      />
    </div>
  );
}
