import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { adminRepository } from "@/lib/repositories";

const ADMIN_SESSION_COOKIE = "marmita_pay_admin_session";

export type AdminSession = {
  id: string;
  nome: string;
  email: string;
};

function getAuthSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "dev-secret";
}

function signValue(value: string): string {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}

function verifySignature(value: string, signature: string): boolean {
  const expectedSignature = signValue(value);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
}

function encodeSession(admin: AdminSession): string {
  const value = Buffer.from(JSON.stringify(admin), "utf8").toString("base64url");
  return `${value}.${signValue(value)}`;
}

function decodeSession(rawSession?: string): AdminSession | null {
  if (!rawSession) {
    return null;
  }

  const [value, signature] = rawSession.split(".");

  if (!value || !signature || !verifySignature(value, signature)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function createAdminSession(admin: AdminSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, encodeSession(admin), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function authenticateAdmin(input: {
  email: string;
  password: string;
}): Promise<AdminSession | null> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD precisam estar configurados.");
  }

  if (
    input.email.trim().toLowerCase() !== adminEmail.trim().toLowerCase() ||
    input.password !== adminPassword
  ) {
    return null;
  }

  const existingAdmin = await adminRepository.findByEmail(adminEmail);
  const admin =
    existingAdmin ??
    (await adminRepository.create({
      nome: "Administrador",
      email: adminEmail,
    }));

  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
  };
}
