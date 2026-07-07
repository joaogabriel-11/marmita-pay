import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { OrderStatusPolling } from "@/components/public/order-status-polling";
import { PublicShell } from "@/components/public/public-shell";
import { pedidoRepository } from "@/lib/repositories";
import { formatMoney } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

type PedidoPageProps = {
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

type MoneyLike = Parameters<typeof formatMoney>[0];

type PedidoItemView = {
  id: string;
  quantidade: number;
  precoUnitario: {
    mul(value: number): MoneyLike;
  };
  cardapioDia: {
    prato: {
      nome: string;
    };
  };
};

type PedidoView = {
  codigoPedido: number;
  status: string;
  valorTotal: MoneyLike;
  itens: PedidoItemView[];
  pagamento: {
    qrCode: string | null;
    qrCodeBase64: string | null;
  } | null;
};

export default async function PedidoPage({ params }: PedidoPageProps) {
  const { codigo } = await params;
  const codigoPedido = Number(codigo);

  if (!Number.isInteger(codigoPedido)) {
    notFound();
  }

  const pedido = (await pedidoRepository.findByCodigoPedido(
    codigoPedido,
  )) as PedidoView | null;

  if (!pedido) {
    notFound();
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl space-y-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Pedido</p>
          <h1 className="mt-1 text-3xl font-semibold">
            #{pedido.codigoPedido}
          </h1>
          <OrderStatusPolling
            codigoPedido={pedido.codigoPedido}
            initialStatus={pedido.status}
            initialStatusLabel={statusLabels[pedido.status]}
          />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold">Itens</h2>
          <div className="mt-4 space-y-3">
            {pedido.itens.map((item: PedidoItemView) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span>
                  {item.quantidade}x {item.cardapioDia.prato.nome}
                </span>
                <strong>
                  {formatMoney(item.precoUnitario.mul(item.quantidade))}
                </strong>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-zinc-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total</span>
              <strong>{formatMoney(pedido.valorTotal)}</strong>
            </div>
          </div>
        </section>

        {pedido.pagamento?.qrCode ? (
          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold">Pagamento Pix</h2>
            {pedido.pagamento.qrCodeBase64 ? (
              <div className="mt-4 flex justify-center">
                <Image
                  src={`data:image/png;base64,${pedido.pagamento.qrCodeBase64}`}
                  alt="QR Code Pix"
                  width={224}
                  height={224}
                  className="h-56 w-56 rounded-md border border-zinc-200 bg-white p-2"
                />
              </div>
            ) : null}
            <h3 className="mt-4 text-sm font-medium">Pix copia e cola</h3>
            <p className="mt-2 break-all rounded-md bg-zinc-100 p-3 text-sm text-zinc-700">
              {pedido.pagamento.qrCode}
            </p>
          </section>
        ) : null}

        <Link
          href="/cardapio"
          className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
        >
          Voltar ao cardapio
        </Link>
      </div>
    </PublicShell>
  );
}
