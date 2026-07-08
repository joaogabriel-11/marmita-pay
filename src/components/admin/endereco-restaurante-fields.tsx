"use client";

import { useState } from "react";

type EnderecoRestauranteFieldsProps = {
  enderecoCep?: string | null;
  enderecoLogradouro?: string | null;
  enderecoNumero?: string | null;
  enderecoComplemento?: string | null;
  enderecoBairro?: string | null;
  enderecoCidade?: string | null;
  enderecoEstado?: string | null;
  enderecoUf?: string | null;
};

type EnderecoCepResponse = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  estado: string;
  uf: string;
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

export function EnderecoRestauranteFields({
  enderecoCep,
  enderecoLogradouro,
  enderecoNumero,
  enderecoComplemento,
  enderecoBairro,
  enderecoCidade,
  enderecoEstado,
  enderecoUf,
}: EnderecoRestauranteFieldsProps) {
  const [cep, setCep] = useState(enderecoCep ?? "");
  const [logradouro, setLogradouro] = useState(enderecoLogradouro ?? "");
  const [bairro, setBairro] = useState(enderecoBairro ?? "");
  const [cidade, setCidade] = useState(enderecoCidade ?? "");
  const [estado, setEstado] = useState(enderecoEstado ?? "");
  const [uf, setUf] = useState(enderecoUf ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleCepBlur() {
    const cepDigits = onlyDigits(cep);

    if (cepDigits.length === 0) {
      setStatus("idle");
      setMessage("");
      return;
    }

    if (cepDigits.length !== 8) {
      setStatus("error");
      setMessage("Informe um CEP com 8 numeros.");
      return;
    }

    setStatus("loading");
    setMessage("Buscando endereco...");

    try {
      const response = await fetch(`/api/cep?cep=${cepDigits}`);
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data?.error?.message ?? "Nao foi possivel buscar o CEP.");
        return;
      }

      const endereco = data as EnderecoCepResponse;

      setCep(endereco.cep);
      setLogradouro(endereco.logradouro);
      setBairro(endereco.bairro);
      setCidade(endereco.localidade);
      setEstado(endereco.estado);
      setUf(endereco.uf);
      setStatus("idle");
      setMessage("Endereco preenchido pelo CEP.");
    } catch {
      setStatus("error");
      setMessage("Nao foi possivel buscar o CEP agora.");
    }
  }

  return (
    <fieldset className="grid gap-3 rounded-lg border border-zinc-200 p-4 lg:col-span-2 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <legend className="font-semibold text-zinc-950">
          Endereco do restaurante
        </legend>
        <p className="mt-1 text-sm text-zinc-600">
          Informe o CEP para preencher rua, bairro, cidade e estado
          automaticamente.
        </p>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        CEP
        <input
          name="enderecoCep"
          value={cep}
          onBlur={handleCepBlur}
          onChange={(event) => setCep(formatCep(event.target.value))}
          inputMode="numeric"
          placeholder="00000-000"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Numero
        <input
          name="enderecoNumero"
          defaultValue={enderecoNumero ?? ""}
          placeholder="Ex: 123"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Logradouro
        <input
          name="enderecoLogradouro"
          value={logradouro}
          onChange={(event) => setLogradouro(event.target.value)}
          placeholder="Nome da rua"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Bairro
        <input
          name="enderecoBairro"
          value={bairro}
          onChange={(event) => setBairro(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Cidade
        <input
          name="enderecoCidade"
          value={cidade}
          onChange={(event) => setCidade(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Estado
        <input
          name="enderecoEstado"
          value={estado}
          onChange={(event) => setEstado(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium lg:col-span-2">
        Complemento
        <input
          name="enderecoComplemento"
          defaultValue={enderecoComplemento ?? ""}
          placeholder="Sala, bloco, ponto de referencia..."
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <input type="hidden" name="enderecoUf" value={uf} />

      {message ? (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-700" : "text-zinc-600"
          }`}
        >
          {message}
        </p>
      ) : null}
    </fieldset>
  );
}
