import { CheckoutClient } from "@/components/public/checkout-client";
import { PublicShell } from "@/components/public/public-shell";
import {
  configuracaoRepository,
  zonaEntregaRepository,
} from "@/lib/repositories";
import { finalizarCheckoutAction } from "./actions";
import { checkoutInitialState } from "./state";

export const dynamic = "force-dynamic";

type ZonaEntregaCheckout = {
  id: string;
  nome: string;
  taxaEntrega: {
    toString(): string;
  };
};

function formatMoneyFromString(value: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export default async function CheckoutPage() {
  const [zonasEntrega, configuracao] = await Promise.all([
    zonaEntregaRepository.list({
      somenteAtivas: true,
    }),
    configuracaoRepository.get(),
  ]);

  return (
    <PublicShell>
      <CheckoutClient
        action={finalizarCheckoutAction}
        initialState={checkoutInitialState}
        pedidoMinimo={configuracao?.pedidoMinimo?.toString() ?? null}
        zonasEntrega={(zonasEntrega as ZonaEntregaCheckout[]).map((zona) => ({
          id: zona.id,
          nome: zona.nome,
          taxaEntrega: zona.taxaEntrega.toString(),
          taxaEntregaFormatada: formatMoneyFromString(
            zona.taxaEntrega.toString(),
          ),
        }))}
      />
    </PublicShell>
  );
}
