export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeBrazilianPhone(value: string): string {
  const digits = onlyDigits(value);

  if (digits.startsWith("55")) {
    return digits;
  }

  return `55${digits}`;
}

export function formatWhatsAppLink(phone: string, message?: string): string {
  const normalizedPhone = normalizeBrazilianPhone(phone);
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";

  return `https://wa.me/${normalizedPhone}${encodedMessage}`;
}
