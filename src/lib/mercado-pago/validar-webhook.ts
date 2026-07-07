import { createHmac, timingSafeEqual } from "crypto";

type ValidarWebhookMercadoPagoInput = {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
};

function getMercadoPagoWebhookSecret(): string {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("MERCADOPAGO_WEBHOOK_SECRET nao configurado.");
  }

  return secret;
}

function parseSignatureHeader(xSignature: string) {
  return Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key.trim(), value.trim()];
    }),
  );
}

export function validarWebhookMercadoPago({
  xSignature,
  xRequestId,
  dataId,
}: ValidarWebhookMercadoPagoInput): boolean {
  if (!xSignature || !xRequestId || !dataId) {
    return false;
  }

  const signatureParts = parseSignatureHeader(xSignature);
  const timestamp = signatureParts.ts;
  const signature = signatureParts.v1;

  if (!timestamp || !signature) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
  const expectedSignature = createHmac(
    "sha256",
    getMercadoPagoWebhookSecret(),
  )
    .update(manifest)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
}
