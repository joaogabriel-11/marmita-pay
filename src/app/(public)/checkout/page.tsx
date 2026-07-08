import { CheckoutClient } from "@/components/public/checkout-client";
import { PublicShell } from "@/components/public/public-shell";
import { configuracaoRepository } from "@/lib/repositories";
import { finalizarCheckoutAction } from "./actions";
import { checkoutInitialState } from "./state";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const configuracao = await configuracaoRepository.get();

  return (
    <PublicShell>
      <CheckoutClient
        action={finalizarCheckoutAction}
        initialState={checkoutInitialState}
        pedidoMinimo={configuracao?.pedidoMinimo?.toString() ?? null}
      />
    </PublicShell>
  );
}
