import { fail, ok, type AppResult } from "@/lib/core/result";

export type CoordenadasEndereco = {
  latitude: number;
  longitude: number;
  enderecoEncontrado: string;
};

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

export async function buscarCoordenadasEndereco(
  endereco: string,
): Promise<
  AppResult<CoordenadasEndereco, BuscarCoordenadasEnderecoError>
> {
  const enderecoNormalizado = normalizarEndereco(endereco);

  if (enderecoNormalizado.length < 10) {
    return fail(
      "ENDERECO_INVALIDO",
      "Informe um endereco completo para buscar a localizacao.",
    );
  }

  const searchParams = new URLSearchParams({
    q: enderecoNormalizado,
    format: "json",
    limit: "1",
    addressdetails: "1",
    countrycodes: "br",
  });

  try {
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

    const data = (await response.json()) as NominatimSearchResponse;
    const enderecoEncontrado = data[0];

    if (!enderecoEncontrado) {
      return fail("ENDERECO_NAO_ENCONTRADO", "Endereco nao encontrado.");
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
      enderecoEncontrado: enderecoEncontrado.display_name ?? enderecoNormalizado,
    });
  } catch {
    return fail(
      "NOMINATIM_INDISPONIVEL",
      "Nao foi possivel consultar a localizacao agora.",
    );
  }
}
