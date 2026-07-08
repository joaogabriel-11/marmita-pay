import { CartClient } from "@/components/public/cart-client";
import { PublicShell } from "@/components/public/public-shell";
import { configuracaoRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function CarrinhoPage() {
  const configuracao = await configuracaoRepository.get();

  return (
    <PublicShell>
      <CartClient
        pedidoMinimo={configuracao?.pedidoMinimo?.toString() ?? null}
      />
    </PublicShell>
  );
}
