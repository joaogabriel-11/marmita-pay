"use server";

import { redirect } from "next/navigation";
import { authenticateAdmin, createAdminSession } from "@/lib/auth/auth";

export type LoginState = {
  message: string | null;
};

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAdminAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const next = getString(formData, "next") || "/admin";

  const admin = await authenticateAdmin({ email, password });

  if (!admin) {
    return { message: "Email ou senha invalidos." };
  }

  await createAdminSession(admin);
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAdminAction() {
  const { destroyAdminSession } = await import("@/lib/auth/auth");
  await destroyAdminSession();
  redirect("/admin/login");
}
