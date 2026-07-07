import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/lib/auth/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    return <>{children}</>;
  }

  return <AdminShell session={session}>{children}</AdminShell>;
}
