import { OrdersClient } from "@/components/public/orders-client";
import { PublicShell } from "@/components/public/public-shell";

export const dynamic = "force-dynamic";

export default function PedidosPage() {
  return (
    <PublicShell>
      <OrdersClient />
    </PublicShell>
  );
}
