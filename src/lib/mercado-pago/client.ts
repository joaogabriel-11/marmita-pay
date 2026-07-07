export function getMercadoPagoAccessToken(): string {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN nao configurado.");
  }

  return accessToken;
}
