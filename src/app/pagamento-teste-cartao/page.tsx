import { CardTestPaymentClient } from "@/components/public/card-test-payment-client";
import { PublicShell } from "@/components/public/public-shell";
import { pagarCartaoTesteAction } from "./actions";

const initialState = {
  success: false,
  message: null,
};

export default function PagamentoTesteCartaoPage() {
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "";

  return (
    <PublicShell>
      <div className="mx-auto max-w-xl">
        <CardTestPaymentClient
          publicKey={publicKey}
          action={pagarCartaoTesteAction}
          initialState={initialState}
        />
      </div>
    </PublicShell>
  );
}
