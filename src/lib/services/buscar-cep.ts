import { fail, ok, type AppResult } from "@/lib/core/result";

export type EnderecoCep = {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
};

export type BuscarCepError =
  | "CEP_INVALIDO"
  | "CEP_NAO_ENCONTRADO"
  | "VIA_CEP_INDISPONIVEL"
  | "VIA_CEP_RESPOSTA_INVALIDA";

type ViaCepResponse = Partial<EnderecoCep> & {
  erro?: boolean | "true";
};

function normalizarCep(cep: string) {
  return cep.replace(/\D/g, "");
}

function isEnderecoCep(data: ViaCepResponse): data is EnderecoCep {
  return (
    typeof data.cep === "string" &&
    typeof data.logradouro === "string" &&
    typeof data.complemento === "string" &&
    typeof data.unidade === "string" &&
    typeof data.bairro === "string" &&
    typeof data.localidade === "string" &&
    typeof data.uf === "string" &&
    typeof data.estado === "string" &&
    typeof data.regiao === "string" &&
    typeof data.ibge === "string" &&
    typeof data.gia === "string" &&
    typeof data.ddd === "string" &&
    typeof data.siafi === "string"
  );
}

export async function buscarCep(
  cep: string,
): Promise<AppResult<EnderecoCep, BuscarCepError>> {
  const cepNormalizado = normalizarCep(cep);

  if (!/^\d{8}$/.test(cepNormalizado)) {
    return fail("CEP_INVALIDO", "Informe um CEP valido com 8 numeros.");
  }

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${cepNormalizado}/json/`,
      { next: { revalidate: 60 * 60 * 24 } },
    );

    if (!response.ok) {
      return fail(
        "VIA_CEP_INDISPONIVEL",
        "Nao foi possivel consultar o CEP agora.",
      );
    }

    const data = (await response.json()) as ViaCepResponse;

    if (data.erro === true || data.erro === "true") {
      return fail("CEP_NAO_ENCONTRADO", "CEP nao encontrado.");
    }

    if (!isEnderecoCep(data)) {
      return fail(
        "VIA_CEP_RESPOSTA_INVALIDA",
        "O ViaCEP retornou dados incompletos para este CEP.",
      );
    }

    return ok(data);
  } catch {
    return fail(
      "VIA_CEP_INDISPONIVEL",
      "Nao foi possivel consultar o CEP agora.",
    );
  }
}
