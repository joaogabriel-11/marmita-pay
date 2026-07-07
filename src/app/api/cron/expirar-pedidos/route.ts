import { NextRequest, NextResponse } from "next/server";
import { expirarPedidosPendentes } from "@/lib/services";

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.replace(/^Bearer\s+/i, "");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return bearerToken === cronSecret || querySecret === cronSecret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const resultado = await expirarPedidosPendentes();

  return NextResponse.json({
    ok: true,
    ...resultado,
  });
}
