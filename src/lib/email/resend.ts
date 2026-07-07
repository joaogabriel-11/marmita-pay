export function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY nao configurado.");
  }

  return apiKey;
}
