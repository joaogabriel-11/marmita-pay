import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/core/domain-error";
import {
  buscarCoordenadasEndereco,
  type TentativaBuscaCoordenadas,
  type TipoBuscaCoordenadas,
} from "./buscar-coordenadas-endereco";
import { calcularRotaCoordenadas } from "./calcular-rota-coordenadas";

type RestauranteComCoordenadas = {
  latitude: number | null;
  longitude: number | null;
};

export type EnderecoEntregaInput = {
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  uf?: string;
};

export type CalcularEntregaPorEnderecoOutput = {
  taxaEntrega: Prisma.Decimal;
  distanciaMetros: number;
  duracaoSegundos: number;
  tipoBusca: TipoBuscaCoordenadas;
  enderecoEncontrado: string;
};

function montarEndereco(partes: Array<string | undefined>) {
  return [...partes, "Brasil"]
    .filter((parte): parte is string => Boolean(parte?.trim()))
    .join(", ");
}

function montarTentativas(input: EnderecoEntregaInput): TentativaBuscaCoordenadas[] {
  return [
    {
      tipoBusca: "enderecoCompleto",
      endereco: montarEndereco([
        input.rua,
        input.numero,
        input.bairro,
        input.cidade,
        input.estado,
      ]),
    },
    {
      tipoBusca: "enderecoSemNumero",
      endereco: montarEndereco([
        input.rua,
        input.bairro,
        input.cidade,
        input.estado,
      ]),
    },
    {
      tipoBusca: "cep",
      endereco: montarEndereco([input.cep, input.cidade, input.estado]),
    },
  ];
}

function calcularTaxaBase(distanciaKm: number) {
  if (distanciaKm <= 1) return new Prisma.Decimal(3.99);
  if (distanciaKm <= 2) return new Prisma.Decimal(4.99);
  if (distanciaKm <= 3) return new Prisma.Decimal(6.99);
  if (distanciaKm <= 5) return new Prisma.Decimal(8.99);
  if (distanciaKm <= 7) return new Prisma.Decimal(11.99);

  throw new DomainError("FORA_DA_AREA_ENTREGA", "Fora da area de entrega");
}

function calcularAdicionalTipoBusca(tipoBusca: TipoBuscaCoordenadas) {
  if (tipoBusca === "enderecoSemNumero") return new Prisma.Decimal(0.3);
  if (tipoBusca === "cep") return new Prisma.Decimal(1);

  return new Prisma.Decimal(0);
}

export async function calcularEntregaPorEndereco(params: {
  restaurante: RestauranteComCoordenadas;
  endereco: EnderecoEntregaInput;
}): Promise<CalcularEntregaPorEnderecoOutput> {
  if (
    params.restaurante.latitude == null ||
    params.restaurante.longitude == null
  ) {
    throw new DomainError(
      "RESTAURANTE_SEM_COORDENADAS",
      "Configure o endereco do restaurante antes de calcular a entrega.",
    );
  }

  const coordenadasCliente = await buscarCoordenadasEndereco(
    montarTentativas(params.endereco),
  );

  if (!coordenadasCliente.success) {
    throw new DomainError(
      coordenadasCliente.error.code,
      coordenadasCliente.error.message,
    );
  }

  const rota = await calcularRotaCoordenadas({
    origem: {
      latitude: params.restaurante.latitude,
      longitude: params.restaurante.longitude,
    },
    destino: {
      latitude: coordenadasCliente.data.latitude,
      longitude: coordenadasCliente.data.longitude,
    },
  });

  if (!rota.success) {
    throw new DomainError(rota.error.code, rota.error.message);
  }

  const distanciaKm = rota.data.distanciaMetros / 1000;
  const taxaEntrega = calcularTaxaBase(distanciaKm).plus(
    calcularAdicionalTipoBusca(coordenadasCliente.data.tipoBusca),
  );

  return {
    taxaEntrega,
    distanciaMetros: rota.data.distanciaMetros,
    duracaoSegundos: rota.data.duracaoSegundos,
    tipoBusca: coordenadasCliente.data.tipoBusca,
    enderecoEncontrado: coordenadasCliente.data.enderecoEncontrado,
  };
}
