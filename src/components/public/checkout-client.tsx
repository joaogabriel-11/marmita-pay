"use client";

import Link from "next/link";
import {
  type FormEvent,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  formatCurrency,
  useCart,
  writeCart,
} from "./cart-store";
import { rememberOrder } from "./orders-store";

type CheckoutActionState =
  | {
      success: false;
      message: string | null;
    }
  | {
      success: true;
      codigoPedido: number;
    };

type CheckoutClientProps = {
  pedidoMinimo: string | null;
  action: (
    state: CheckoutActionState,
    formData: FormData,
  ) => Promise<CheckoutActionState>;
  initialState: CheckoutActionState;
};

type EnderecoCepResponse = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  estado: string;
  uf: string;
};

type DistanciaEntregaResponse = {
  taxaEntrega: string;
  distanciaMetros: number;
  duracaoSegundos: number;
  tipoBusca: "enderecoCompleto" | "enderecoSemNumero" | "cep";
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function CheckoutClient({
  pedidoMinimo,
  action,
  initialState,
}: CheckoutClientProps) {
  const router = useRouter();
  const items = useCart();
  const allowSubmitRef = useRef(false);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [tipoEntrega, setTipoEntrega] = useState<"DELIVERY" | "RETIRADA">(
    "RETIRADA",
  );
  const [enderecoCep, setEnderecoCep] = useState("");
  const [enderecoRua, setEnderecoRua] = useState("");
  const [enderecoBairro, setEnderecoBairro] = useState("");
  const [enderecoCidade, setEnderecoCidade] = useState("");
  const [enderecoEstado, setEnderecoEstado] = useState("");
  const [enderecoUf, setEnderecoUf] = useState("");
  const [cepStatus, setCepStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [cepMessage, setCepMessage] = useState("");
  const [distanciaEntrega, setDistanciaEntrega] =
    useState<DistanciaEntregaResponse | null>(null);
  const [distanciaMessage, setDistanciaMessage] = useState("");
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.preco) * item.quantidade,
        0,
      ),
    [items],
  );
  const taxaEntregaValue =
    tipoEntrega === "DELIVERY" && distanciaEntrega
      ? Number(distanciaEntrega.taxaEntrega)
      : 0;
  const total = subtotal + taxaEntregaValue;
  const pedidoMinimoValue = pedidoMinimo ? Number(pedidoMinimo) : null;
  const pedidoMinimoAtingido =
    !pedidoMinimoValue || subtotal >= pedidoMinimoValue;
  const itensJson = useMemo(
    () =>
      JSON.stringify(
        items.map((item) => ({
          cardapioDiaId: item.cardapioDiaId,
          quantidade: item.quantidade,
        })),
      ),
    [items],
  );

  useEffect(() => {
    if (!state.success) {
      return;
    }

    rememberOrder(state.codigoPedido);
    router.replace(`/pedido/${state.codigoPedido}`);
    window.setTimeout(() => writeCart([]), 0);
  }, [router, state]);

  async function buscarEnderecoPorCep() {
    const cepDigits = onlyDigits(enderecoCep);

    if (cepDigits.length === 0) {
      setCepStatus("idle");
      setCepMessage("");
      return;
    }

    if (cepDigits.length !== 8) {
      setCepStatus("error");
      setCepMessage("Informe um CEP com 8 numeros.");
      return;
    }

      setCepStatus("loading");
      setCepMessage("Buscando endereco...");
      setDistanciaEntrega(null);
      setDistanciaMessage("");

    try {
      const response = await fetch(`/api/cep?cep=${cepDigits}`);
      const data = await response.json();

      if (!response.ok) {
        setCepStatus("error");
        setCepMessage(data?.error?.message ?? "Nao foi possivel buscar o CEP.");
        return;
      }

      const endereco = data as EnderecoCepResponse;

      setEnderecoCep(endereco.cep);
      setEnderecoRua(endereco.logradouro);
      setEnderecoBairro(endereco.bairro);
      setEnderecoCidade(endereco.localidade);
      setEnderecoEstado(endereco.estado);
      setEnderecoUf(endereco.uf);
      setCepStatus("success");
      setCepMessage("Endereco preenchido pelo CEP.");
    } catch {
      setCepStatus("error");
      setCepMessage("Nao foi possivel buscar o CEP agora.");
    }
  }

  async function calcularDistanciaEntrega(formData: FormData) {
    const response = await fetch("/api/entrega/distancia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cep: formData.get("enderecoCep"),
        rua: formData.get("enderecoRua"),
        numero: formData.get("enderecoNumero"),
        bairro: formData.get("enderecoBairro"),
        cidade: formData.get("enderecoCidade"),
        estado: formData.get("enderecoEstado"),
        uf: formData.get("enderecoUf"),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ?? "Nao foi possivel calcular a distancia.",
      );
    }

    return data as DistanciaEntregaResponse;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (tipoEntrega !== "DELIVERY" || allowSubmitRef.current) {
      allowSubmitRef.current = false;
      return;
    }

    event.preventDefault();

    if (distanciaEntrega) {
      allowSubmitRef.current = true;
      event.currentTarget.requestSubmit();
      return;
    }

    setIsCalculatingDistance(true);
    setDistanciaMessage("Calculando distancia de entrega...");
    setDistanciaEntrega(null);

    try {
      const formData = new FormData(event.currentTarget);
      const distancia = await calcularDistanciaEntrega(formData);

      setDistanciaEntrega(distancia);
      setDistanciaMessage("");
    } catch (error) {
      setDistanciaMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel calcular a distancia.",
      );
    } finally {
      setIsCalculatingDistance(false);
    }
  }

  function invalidateDeliveryRate() {
    setDistanciaEntrega(null);
    setDistanciaMessage("");
  }

  if (state.success) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold">Pedido criado</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Estamos abrindo a tela de pagamento do pedido #{state.codigoPedido}.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold">Nada para finalizar</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Seu carrinho esta vazio no momento.
        </p>
        <Link
          href="/cardapio"
          className="mt-4 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
          Ver cardapio
        </Link>
      </div>
    );
  }

  if (!pedidoMinimoAtingido) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold">
          Pedido minimo de {formatCurrency(pedidoMinimoValue ?? 0)}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Adicione mais itens ao carrinho para finalizar o pedido.
        </p>
        <Link
          href="/carrinho"
          className="mt-4 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
          Voltar ao carrinho
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <input type="hidden" name="itens" value={itensJson} />
        <input type="hidden" name="tipoEntrega" value={tipoEntrega} />

        <div>
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Informe seus dados para preparar o pagamento Pix.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Nome</span>
            <input
              name="clienteNome"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">WhatsApp</span>
            <input
              name="clienteTelefone"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Email opcional</span>
            <input
              name="clienteEmail"
              type="email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Modalidade</span>
          <div className="grid grid-cols-2 gap-2">
            {(["RETIRADA", "DELIVERY"] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => {
                  setTipoEntrega(tipo);
                  setDistanciaEntrega(null);
                  setDistanciaMessage("");
                }}
                className={`rounded-md border px-3 py-2 text-sm font-medium ${
                  tipoEntrega === tipo
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-300 bg-white text-zinc-800"
                }`}
              >
                {tipo === "RETIRADA" ? "Retirada" : "Entrega"}
              </button>
            ))}
          </div>
        </div>

        {tipoEntrega === "DELIVERY" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">CEP</span>
              <input
                name="enderecoCep"
                value={enderecoCep}
                onBlur={buscarEnderecoPorCep}
                onChange={(event) => {
                  invalidateDeliveryRate();
                  setEnderecoCep(formatCep(event.target.value));
                }}
                inputMode="numeric"
                placeholder="00000-000"
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
                required
              />
              {cepMessage ? (
                <span
                  className={`block text-xs ${
                    cepStatus === "error" ? "text-red-700" : "text-zinc-500"
                  }`}
                >
                  {cepMessage}
                </span>
              ) : null}
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Rua</span>
              <input
                name="enderecoRua"
                value={enderecoRua}
                onChange={(event) => {
                  invalidateDeliveryRate();
                  setEnderecoRua(event.target.value);
                }}
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Numero</span>
              <input
                name="enderecoNumero"
                onChange={invalidateDeliveryRate}
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Bairro</span>
              <input
                name="enderecoBairro"
                value={enderecoBairro}
                onChange={(event) => {
                  invalidateDeliveryRate();
                  setEnderecoBairro(event.target.value);
                }}
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Cidade</span>
              <input
                name="enderecoCidade"
                value={enderecoCidade}
                onChange={(event) => {
                  invalidateDeliveryRate();
                  setEnderecoCidade(event.target.value);
                }}
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Estado</span>
              <input
                name="enderecoEstado"
                value={enderecoEstado}
                onChange={(event) => {
                  invalidateDeliveryRate();
                  setEnderecoEstado(event.target.value);
                }}
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
                required
              />
            </label>
            <input type="hidden" name="enderecoUf" value={enderecoUf} />
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Complemento</span>
              <input
                name="enderecoComplemento"
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>
        ) : null}

        {!state.success && state.message ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}

        {distanciaMessage ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {distanciaMessage}
          </p>
        ) : null}

        {tipoEntrega === "DELIVERY" && distanciaEntrega ? (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <p>
              Taxa de entrega:{" "}
              {formatCurrency(Number(distanciaEntrega.taxaEntrega))}
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending || isCalculatingDistance}
          className="w-full rounded-md bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isPending
            ? "Gerando Pix..."
            : isCalculatingDistance
              ? "Calculando entrega..."
              : tipoEntrega === "DELIVERY" && !distanciaEntrega
                ? "Calcular taxa de entrega"
                : "Gerar Pix"}
        </button>
      </form>

      <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Pedido</h2>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.cardapioDiaId}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span>
                {item.quantidade}x {item.nome}
              </span>
              <strong>{formatCurrency(Number(item.preco) * item.quantidade)}</strong>
            </div>
          ))}
        </div>
        <div className="mt-4">
          {tipoEntrega === "DELIVERY" ? (
            <div className="flex items-center justify-between">
              <span className="text-sm">Frete</span>
              <strong>
                {distanciaEntrega
                  ? formatCurrency(Number(distanciaEntrega.taxaEntrega))
                  : "A calcular"}
              </strong>
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3">
            <span className="text-sm font-medium">Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
