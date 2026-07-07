"use client";

import Script from "next/script";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { PagamentoTesteCartaoState } from "@/app/pagamento-teste-cartao/actions";

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => {
      createCardToken: (cardData: {
        cardNumber: string;
        cardholderName: string;
        cardExpirationMonth: string;
        cardExpirationYear: string;
        securityCode: string;
        identificationType: string;
        identificationNumber: string;
      }) => Promise<{ id: string }>;
      getPaymentMethods: (input: {
        bin: string;
      }) => Promise<
        | Array<{ id: string; issuer?: { id?: string } }>
        | {
            results?: Array<{ id: string; issuer?: { id?: string } }>;
          }
      >;
    };
  }
}

type CardTestPaymentClientProps = {
  publicKey: string;
  action: (
    state: PagamentoTesteCartaoState,
    formData: FormData,
  ) => Promise<PagamentoTesteCartaoState>;
  initialState: PagamentoTesteCartaoState;
};

export function CardTestPaymentClient({
  publicKey,
  action,
  initialState,
}: CardTestPaymentClientProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [scriptReady, setScriptReady] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [hiddenFields, setHiddenFields] = useState({
    token: "",
    paymentMethodId: "",
    issuerId: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  const mp = useMemo(() => {
    if (!scriptReady || !window.MercadoPago || !publicKey) {
      return null;
    }

    return new window.MercadoPago(publicKey, { locale: "pt-BR" });
  }, [publicKey, scriptReady]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!publicKey) {
      event.preventDefault();
      setClientError("NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY nao configurada.");
      return;
    }

    if (!mp) {
      event.preventDefault();
      setClientError("SDK do Mercado Pago ainda esta carregando.");
      return;
    }

    if (!hiddenFields.token) {
      event.preventDefault();
      setClientError(null);

      const formData = new FormData(event.currentTarget);
      const cardNumber = String(formData.get("cardNumber") ?? "").replace(
        /\s/g,
        "",
      );
      const expiration = String(formData.get("expiration") ?? "");
      const [cardExpirationMonth, cardExpirationYearRaw] =
        expiration.split("/");
      const cardExpirationYear =
        cardExpirationYearRaw?.length === 2
          ? `20${cardExpirationYearRaw}`
          : cardExpirationYearRaw;
      const bin = cardNumber.slice(0, 6);

      try {
        const [{ id: token }, paymentMethods] = await Promise.all([
          mp.createCardToken({
            cardNumber,
            cardholderName: String(formData.get("cardholderName") ?? ""),
            cardExpirationMonth: cardExpirationMonth ?? "",
            cardExpirationYear: cardExpirationYear ?? "",
            securityCode: String(formData.get("securityCode") ?? ""),
            identificationType: String(
              formData.get("identificationType") ?? "CPF",
            ),
            identificationNumber: String(
              formData.get("identificationNumber") ?? "",
            ),
          }),
          mp.getPaymentMethods({ bin }),
        ]);
        const paymentMethodResults = Array.isArray(paymentMethods)
          ? paymentMethods
          : (paymentMethods.results ?? []);
        const paymentMethodIdFromSelect = String(
          formData.get("paymentMethodIdFallback") ?? "",
        );
        const paymentMethod = paymentMethodResults[0];
        const paymentMethodId = paymentMethod?.id || paymentMethodIdFromSelect;

        if (!paymentMethodId) {
          throw new Error("Bandeira do cartao nao identificada.");
        }

        setHiddenFields({
          token,
          paymentMethodId,
          issuerId: paymentMethod.issuer?.id ?? "",
        });
      } catch (error) {
        setClientError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel tokenizar o cartao.",
        );
      }
    }
  }

  useEffect(() => {
    if (!formRef.current || !hiddenFields.token) {
      return;
    }

    formRef.current.requestSubmit();
  }, [hiddenFields.token]);

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        onLoad={() => setScriptReady(true)}
      />
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5"
      >
        <input type="hidden" name="token" value={hiddenFields.token} />
        <input
          type="hidden"
          name="paymentMethodId"
          value={hiddenFields.paymentMethodId}
        />
        <input type="hidden" name="issuerId" value={hiddenFields.issuerId} />
        <input type="hidden" name="installments" value="1" />
        <input type="hidden" name="amount" value="1" />

        <div>
          <h1 className="text-2xl font-semibold">Pagamento teste</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Use o cartao de teste do Mercado Pago para liberar a conta.
          </p>
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Email do pagador teste</span>
          <input
            name="payerEmail"
            type="email"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Numero do cartao</span>
          <input
            name="cardNumber"
            inputMode="numeric"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Bandeira, se nao identificar</span>
          <select
            name="paymentMethodIdFallback"
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value="">Detectar automaticamente</option>
            <option value="visa">Visa</option>
            <option value="master">Mastercard</option>
            <option value="amex">American Express</option>
            <option value="elo">Elo</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Nome impresso</span>
          <input
            name="cardholderName"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Validade</span>
            <input
              name="expiration"
              placeholder="11/30"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">CVV</span>
            <input
              name="securityCode"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Documento</span>
            <select
              name="identificationType"
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            >
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
            </select>
          </label>
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Numero do documento</span>
          <input
            name="identificationNumber"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        {clientError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {clientError}
          </p>
        ) : null}

        {!publicKey ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Configure NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no .env e reinicie o
            servidor.
          </p>
        ) : null}

        {state.message ? (
          <p
            className={`rounded-md px-3 py-2 text-sm ${
              state.success
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {state.message}
            {state.paymentId ? ` ID: ${state.paymentId}` : ""}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!publicKey || !scriptReady || isPending}
          className="w-full rounded-md bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isPending ? "Processando..." : "Pagar R$ 1,00"}
        </button>
      </form>
    </>
  );
}
