import { DomainError } from "@/lib/core/domain-error";
import {
  cardapioRepository,
  configuracaoRepository,
  pedidoRepository,
} from "@/lib/repositories";
import {
  getTodayDateOnlyInSaoPaulo,
  isBeforeCutoff,
} from "@/lib/utils/dates";
import { formatMoney } from "@/lib/utils/money";
import {
  calcularDisponibilidadeReal,
  mapearReservasAtivas,
} from "./verificar-disponibilidade";
import { expirarPedidosPendentes } from "./expirar-pedidos-pendentes";

export type CardapioPublicoItem = {
  id: string;
  pratoId: string;
  nome: string;
  descricao: string;
  fotoUrl: string | null;
  categoria: string;
  preco: string;
  precoFormatado: string;
  destaque: boolean;
  disponivelReal: number;
  esgotado: boolean;
};

export type CardapioPublico = {
  restaurante: {
    nome: string;
    pedidosAtivos: boolean;
    motivoFechamento: string | null;
    horarioCorte: string;
    modoEntrega: string;
    whatsappContato: string | null;
  };
  status: {
    aberto: boolean;
    mensagem: string | null;
  };
  itens: CardapioPublicoItem[];
};

export async function listarCardapioPublico(
  agora = new Date(),
): Promise<CardapioPublico> {
  await expirarPedidosPendentes(agora);

  const configuracao = await configuracaoRepository.get();

  if (!configuracao) {
    throw new DomainError(
      "CONFIGURACAO_NAO_ENCONTRADA",
      "Configuracao do restaurante nao encontrada.",
    );
  }

  const data = getTodayDateOnlyInSaoPaulo(agora);
  const cardapios = await cardapioRepository.listByDate(data, {
    somenteAtivos: true,
  });
  const reservas = mapearReservasAtivas(
    await pedidoRepository.listReservasAtivas(
      cardapios.map((cardapio) => cardapio.id),
      agora,
    ),
  );
  const reservasPorCardapio = new Map(
    reservas.map((reserva) => [
      reserva.cardapioDiaId,
      reserva.quantidadeReservada,
    ]),
  );
  const dentroHorario = isBeforeCutoff(configuracao.horarioCorte, agora);
  const aberto = configuracao.pedidosAtivos && dentroHorario;

  return {
    restaurante: {
      nome: configuracao.nomeRestaurante,
      pedidosAtivos: configuracao.pedidosAtivos,
      motivoFechamento: configuracao.motivoFechamento,
      horarioCorte: configuracao.horarioCorte,
      modoEntrega: configuracao.modoEntrega,
      whatsappContato: configuracao.whatsappContato,
    },
    status: {
      aberto,
      mensagem: !configuracao.pedidosAtivos
        ? (configuracao.motivoFechamento ?? "Pedidos indisponiveis no momento.")
        : !dentroHorario
          ? "Pedidos encerrados por hoje. Volte amanha para conferir o novo cardapio."
          : null,
    },
    itens: cardapios.map((cardapio) => {
      const disponibilidade = calcularDisponibilidadeReal(
        cardapio,
        reservasPorCardapio.get(cardapio.id) ?? 0,
      );

      return {
        id: cardapio.id,
        pratoId: cardapio.pratoId,
        nome: cardapio.prato.nome,
        descricao: cardapio.prato.descricao,
        fotoUrl: cardapio.prato.fotoUrl,
        categoria: cardapio.prato.categoria.nome,
        preco: cardapio.precoDoDia.toString(),
        precoFormatado: formatMoney(cardapio.precoDoDia),
        destaque: cardapio.destaque,
        disponivelReal: disponibilidade.disponivelReal,
        esgotado: disponibilidade.disponivelReal <= 0,
      };
    }),
  };
}
