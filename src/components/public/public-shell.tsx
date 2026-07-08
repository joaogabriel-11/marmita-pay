import Link from "next/link";

type PublicShellProps = {
  children: React.ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/cardapio" className="text-lg font-semibold">
            Marmita Pay
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/pedidos"
              className="rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Pedidos
            </Link>
            <Link
              href="/cardapio"
              className="rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Cardapio
            </Link>
            <Link
              href="/carrinho"
              className="rounded-md bg-zinc-950 px-3 py-2 font-medium text-white"
            >
              Carrinho
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </main>
  );
}
