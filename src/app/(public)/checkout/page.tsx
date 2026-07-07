import { Prisma } from "@prisma/client";
import { CheckoutClient } from "@/components/public/checkout-client";
import { PublicShell } from "@/components/public/public-shell";
import { zonaEntregaRepository } from "@/lib/repositories";
import { formatMoney } from "@/lib/utils/money";
import { finalizarCheckoutAction } from "./actions";
import { checkoutInitialState } from "./state";

export const dynamic = "force-dynamic";

type ZonaEntregaCheckout = {
  id: string;
  nome: string;
  taxaEntrega: Prisma.Decimal;
};

export default async function CheckoutPage() {
  const zonasEntrega: ZonaEntregaCheckout[] = await zonaEntregaRepository.list({
    somenteAtivas: true,
  });

  return (
    <PublicShell>
      <CheckoutClient
        action={finalizarCheckoutAction}
        initialState={checkoutInitialState}
        zonasEntrega={zonasEntrega.map((zona) => ({
          id: zona.id,
          nome: zona.nome,
          taxaEntrega: zona.taxaEntrega.toString(),
          taxaEntregaFormatada: formatMoney(zona.taxaEntrega),
        }))}
      />
    </PublicShell>
  );
}
