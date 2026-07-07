export function getMercadoPagoAccessToken(): string {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN nao configurado.");
  }

  return accessToken;
}

export function getMercadoPagoApiBaseUrl(): string {
  return "https://api.mercadopago.com";
}

export function getMercadoPagoNotificationUrl(): string | undefined {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    return undefined;
  }

  const parsedUrl = new URL(appUrl);

  if (["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
    return undefined;
  }

  return `${parsedUrl.origin}/api/webhooks/mercado-pago`;
}
