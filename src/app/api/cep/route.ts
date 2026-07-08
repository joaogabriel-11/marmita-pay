import { NextResponse } from "next/server";
import { buscarCep } from "@/lib/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cep = searchParams.get("cep") ?? "";
  const result = await buscarCep(cep);

  if (result.success) {
    return NextResponse.json(result.data);
  }

  const statusByCode = {
    CEP_INVALIDO: 400,
    CEP_NAO_ENCONTRADO: 404,
    VIA_CEP_INDISPONIVEL: 503,
    VIA_CEP_RESPOSTA_INVALIDA: 502,
  } satisfies Record<typeof result.error.code, number>;

  return NextResponse.json(
    { error: result.error },
    { status: statusByCode[result.error.code] },
  );
}
