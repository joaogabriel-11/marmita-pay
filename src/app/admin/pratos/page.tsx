import { PratosManager } from "@/components/admin/pratos-manager";
import {
  categoriaRepository,
  pratoRepository,
} from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function AdminPratosPage() {
  const [categorias, pratos] = await Promise.all([
    categoriaRepository.list(),
    pratoRepository.list(),
  ]);

  return (
    <PratosManager
      categorias={categorias.map((categoria) => ({
        id: categoria.id,
        nome: categoria.nome,
        ordem: categoria.ordem,
        ativo: categoria.ativo,
      }))}
      pratos={pratos.map((prato) => ({
        id: prato.id,
        nome: prato.nome,
        descricao: prato.descricao,
        fotoUrl: prato.fotoUrl,
        precoBase: prato.precoBase.toString(),
        ativo: prato.ativo,
        categoriaId: prato.categoriaId,
        categoriaNome: prato.categoria.nome,
      }))}
    />
  );
}
