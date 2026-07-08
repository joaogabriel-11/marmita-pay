import { NextResponse } from "next/server";
import { DomainError } from "@/lib/core/domain-error";
import { configuracaoRepository } from "@/lib/repositories";
import { calcularEntregaPorEndereco } from "@/lib/services";

type DistanciaEntregaRequest = {
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  uf?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<DistanciaEntregaRequest>;
  const configuracao = await configuracaoRepository.get();

  if (!configuracao) {
    return NextResponse.json(
      {
        error: {
          message: "Configuracao do restaurante nao encontrada.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const entrega = await calcularEntregaPorEndereco({
      restaurante: configuracao,
      endereco: {
        cep: body.cep,
        rua: body.rua,
        numero: body.numero,
        bairro: body.bairro,
        cidade: body.cidade,
        estado: body.estado,
        uf: body.uf,
      },
    });

    return NextResponse.json(
      {
        taxaEntrega: entrega.taxaEntrega.toString(),
        distanciaMetros: entrega.distanciaMetros,
        duracaoSegundos: entrega.duracaoSegundos,
        enderecoEncontrado: entrega.enderecoEncontrado,
        tipoBusca: entrega.tipoBusca,
      },
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: { message: "Nao foi possivel calcular a entrega." } },
      { status: 400 },
    );
  }
}
