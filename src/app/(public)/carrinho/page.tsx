import { CartClient } from "@/components/public/cart-client";
import { PublicShell } from "@/components/public/public-shell";

export default function CarrinhoPage() {
  return (
    <PublicShell>
      <CartClient />
    </PublicShell>
  );
}
