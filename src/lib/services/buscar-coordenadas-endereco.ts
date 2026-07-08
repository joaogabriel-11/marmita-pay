import { fail, ok, type AppResult } from "@/lib/core/result";

export type CoordenadasEndereco = {
  latitude: number;
  longitude: number;
  enderecoEncontrado: string;
  tipoBusca: TipoBuscaCoordenadas;
};

export type TipoBuscaCoordenadas =
  | "enderecoCompleto"
  | "enderecoSemNumero"
  | "cep";

export type BuscarCoordenadasEnderecoError =
  | "ENDERECO_INVALIDO"
  | "ENDERECO_NAO_ENCONTRADO"
  | "NOMINATIM_INDISPONIVEL"
  | "NOMINATIM_RESPOSTA_INVALIDA";

type NominatimSearchResponse = Array<{
  lat?: string;
  lon?: string;
  display_name?: string;
}>;

export type TentativaBuscaCoordenadas = {
  tipoBusca: TipoBuscaCoordenadas;
  endereco: string;
};

function normalizarEndereco(endereco: string) {
  return endereco.trim().replace(/\s+/g, " ");
}

function isCoordenadaValida(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

async function buscarNoNominatim(endereco: string) {
  const searchParams = new URLSearchParams({
    q: endereco,
    format: "json",
    limit: "1",
    addressdetails: "1",
    countrycodes: "br",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`,
    {
      headers: {
        "User-Agent": "MarmitaPay/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 * 24 * 7 },
    },
  );

  if (!response.ok) {
    return fail(
      "NOMINATIM_INDISPONIVEL",
      "Nao foi possivel consultar a localizacao agora.",
    );
  }

  return ok((await response.json()) as NominatimSearchResponse);
}

export async function buscarCoordenadasEndereco(
  enderecoOuTentativas: string | TentativaBuscaCoordenadas[],
): Promise<
  AppResult<CoordenadasEndereco, BuscarCoordenadasEnderecoError>
> {
  const tentativas =
    typeof enderecoOuTentativas === "string"
      ? [
          {
            tipoBusca: "enderecoCompleto" as const,
            endereco: enderecoOuTentativas,
          },
        ]
      : enderecoOuTentativas;
  const tentativasValidas = tentativas
    .map((tentativa) => ({
      ...tentativa,
      endereco: normalizarEndereco(tentativa.endereco),
    }))
    .filter((tentativa) => tentativa.endereco.length >= 10);

  if (tentativasValidas.length === 0) {
    return fail(
      "ENDERECO_INVALIDO",
      "Informe um endereco completo para buscar a localizacao.",
    );
  }

  try {
    for (const tentativa of tentativasValidas) {
      const result = await buscarNoNominatim(tentativa.endereco);

      if (!result.success) {
        return result;
      }

      const enderecoEncontrado = result.data[0];

      if (!enderecoEncontrado) {
        continue;
      }

      const latitude = Number(enderecoEncontrado.lat);
      const longitude = Number(enderecoEncontrado.lon);

      if (!isCoordenadaValida(latitude, longitude)) {
        return fail(
          "NOMINATIM_RESPOSTA_INVALIDA",
          "A localizacao retornada para este endereco e invalida.",
        );
      }

      return ok({
        latitude,
        longitude,
        enderecoEncontrado:
          enderecoEncontrado.display_name ?? tentativa.endereco,
        tipoBusca: tentativa.tipoBusca,
      });
    }

    return fail("ENDERECO_NAO_ENCONTRADO", "Endereço não encontrado");
  } catch {
    return fail(
      "NOMINATIM_INDISPONIVEL",
      "Nao foi possivel consultar a localizacao agora.",
    );
  }
}
