import { CheckoutClient } from "@/components/public/checkout-client";
import { PublicShell } from "@/components/public/public-shell";
import { zonaEntregaRepository } from "@/lib/repositories";
import { formatMoney } from "@/lib/utils/money";
import { finalizarCheckoutAction } from "./actions";
import { checkoutInitialState } from "./state";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const zonasEntrega = await zonaEntregaRepository.list({
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
