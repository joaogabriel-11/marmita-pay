import { MenuClient } from "@/components/public/menu-client";
import { PublicShell } from "@/components/public/public-shell";
import { listarCardapioPublico } from "@/lib/services/listar-cardapio-publico";

export const dynamic = "force-dynamic";

export default async function CardapioPage() {
  const cardapio = await listarCardapioPublico();

  return (
    <PublicShell>
      <div className="space-y-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Cardapio de hoje
              </p>
              <h1 className="mt-1 text-3xl font-semibold">
                {cardapio.restaurante.nome}
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Pedidos ate {cardapio.restaurante.horarioCorte}. Escolha seus
                itens e revise o carrinho antes do checkout.
              </p>
            </div>
            <div
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                cardapio.status.aberto
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-zinc-100 text-zinc-700"
              }`}
            >
              {cardapio.status.aberto ? "Aberto para pedidos" : "Fechado"}
            </div>
          </div>
          {cardapio.status.mensagem ? (
            <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {cardapio.status.mensagem}
            </p>
          ) : null}
        </section>

        {cardapio.itens.length > 0 ? (
          <MenuClient itens={cardapio.itens} aberto={cardapio.status.aberto} />
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
            <h2 className="text-xl font-semibold">
              Nenhum item no cardapio de hoje
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Volte mais tarde para conferir as marmitas disponiveis.
            </p>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
