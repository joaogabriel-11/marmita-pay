import { fail, ok, type AppResult } from "@/lib/core/result";

export type Coordenada = {
  latitude: number;
  longitude: number;
};

export type RotaCoordenadas = {
  distanciaMetros: number;
  duracaoSegundos: number;
};

export type CalcularRotaCoordenadasError =
  | "COORDENADAS_INVALIDAS"
  | "ROTA_NAO_ENCONTRADA"
  | "OSRM_INDISPONIVEL"
  | "OSRM_RESPOSTA_INVALIDA";

type OsrmRouteResponse = {
  code?: string;
  routes?: Array<{
    duration?: number;
    distance?: number;
  }>;
};

function isCoordenadaValida(coordenada: Coordenada) {
  return (
    Number.isFinite(coordenada.latitude) &&
    Number.isFinite(coordenada.longitude) &&
    coordenada.latitude >= -90 &&
    coordenada.latitude <= 90 &&
    coordenada.longitude >= -180 &&
    coordenada.longitude <= 180
  );
}

export async function calcularRotaCoordenadas(params: {
  origem: Coordenada;
  destino: Coordenada;
}): Promise<AppResult<RotaCoordenadas, CalcularRotaCoordenadasError>> {
  if (!isCoordenadaValida(params.origem) || !isCoordenadaValida(params.destino)) {
    return fail(
      "COORDENADAS_INVALIDAS",
      "Informe coordenadas validas para calcular a rota.",
    );
  }

  const origem = `${params.origem.longitude},${params.origem.latitude}`;
  const destino = `${params.destino.longitude},${params.destino.latitude}`;

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${origem};${destino}?overview=false`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 * 60 },
      },
    );

    if (!response.ok) {
      return fail(
        "OSRM_INDISPONIVEL",
        "Nao foi possivel calcular a rota agora.",
      );
    }

    const data = (await response.json()) as OsrmRouteResponse;

    if (data.code !== "Ok") {
      return fail("ROTA_NAO_ENCONTRADA", "Rota nao encontrada.");
    }

    const route = data.routes?.[0];
    const distanciaMetros = route?.distance;
    const duracaoSegundos = route?.duration;

    if (
      typeof distanciaMetros !== "number" ||
      typeof duracaoSegundos !== "number" ||
      !Number.isFinite(distanciaMetros) ||
      !Number.isFinite(duracaoSegundos)
    ) {
      return fail(
        "OSRM_RESPOSTA_INVALIDA",
        "A rota retornada esta incompleta.",
      );
    }

    return ok({
      distanciaMetros,
      duracaoSegundos,
    });
  } catch {
    return fail(
      "OSRM_INDISPONIVEL",
      "Nao foi possivel calcular a rota agora.",
    );
  }
}
