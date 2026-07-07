import Link from "next/link";
import { logoutAdminAction } from "@/app/admin/login/actions";
import type { AdminSession } from "@/lib/auth/auth";

type AdminShellProps = {
  session: AdminSession;
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/cardapio", label: "Cardapio" },
  { href: "/admin/pratos", label: "Pratos" },
  { href: "/admin/configuracoes", label: "Configuracoes" },
];

type NavItem = (typeof navItems)[number];

export function AdminShell({ session, children }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/admin" className="text-lg font-semibold">
              Marmita Pay Admin
            </Link>
            <p className="text-xs text-zinc-500">{session.email}</p>
          </div>
          <form action={logoutAdminAction}>
            <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium">
              Sair
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-3">
          <nav className="space-y-1">
            {navItems.map((item: NavItem) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
}
