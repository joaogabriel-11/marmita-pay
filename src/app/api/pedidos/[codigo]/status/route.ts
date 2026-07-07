import { NextRequest, NextResponse } from "next/server";
import { pedidoRepository } from "@/lib/repositories";
import { sincronizarPagamentoPedido } from "@/lib/services";
import { formatMoney } from "@/lib/utils/money";

type PedidoStatusRouteProps = {
  params: Promise<{ codigo: string }>;
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

export async function GET(
  request: NextRequest,
  { params }: PedidoStatusRouteProps,
) {
  const { codigo } = await params;
  const codigoPedido = Number(codigo);

  if (!Number.isInteger(codigoPedido)) {
    return NextResponse.json({ error: "Codigo invalido." }, { status: 400 });
  }

  const shouldSync = request.nextUrl.searchParams.get("sync") === "1";
  const pedido = shouldSync
    ? await sincronizarPagamentoPedido(codigoPedido)
    : await pedidoRepository.findByCodigoPedido(codigoPedido);

  if (!pedido) {
    return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    codigoPedido: pedido.codigoPedido,
    status: pedido.status,
    statusLabel: statusLabels[pedido.status],
    pagamentoStatus: pedido.pagamento?.status ?? null,
    valorTotal: pedido.valorTotal.toString(),
    valorTotalFormatado: formatMoney(pedido.valorTotal),
  });
}
