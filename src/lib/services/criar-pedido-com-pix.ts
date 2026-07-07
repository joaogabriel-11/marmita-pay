import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/core/domain-error";
import { PEDIDO_EXPIRACAO_MINUTOS } from "@/lib/core/constants";
import prisma from "@/lib/prisma";
import {
  cardapioRepository,
  configuracaoRepository,
  createCardapioRepository,
  createPagamentoRepository,
  createPedidoRepository,
  pedidoRepository,
  zonaEntregaRepository,
} from "@/lib/repositories";
import { addMinutes, getTodayDateOnlyInSaoPaulo } from "@/lib/utils/dates";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import { calcularTaxaEntrega } from "./calcular-taxa-entrega";
import {
  assertItensDisponiveis,
  mapearReservasAtivas,
  somarItensPedido,
} from "./verificar-disponibilidade";
import { assertDentroHorarioCorte } from "./verificar-horario-corte";
import { assertTipoEntregaPermitido } from "./validar-tipo-entrega";
import { expirarPedidosPendentes } from "./expirar-pedidos-pendentes";

export type CriarPagamentoPixInput = {
  pedidoId: string;
  codigoPedido: number;
  valor: Prisma.Decimal;
  clienteEmail?: string | null;
};

export type CriarPagamentoPixOutput = {
  gatewayPaymentId: string;
  qrCode: string;
  qrCodeBase64?: string | null;
};

export type CriarPagamentoPix = (
  input: CriarPagamentoPixInput,
) => Promise<CriarPagamentoPixOutput>;

export async function criarPedidoComPix(
  input: CheckoutInput,
  criarPagamentoPix: CriarPagamentoPix,
  agora = new Date(),
) {
  const checkout = checkoutSchema.parse(input);
  await expirarPedidosPendentes(agora);

  const configuracao = await configuracaoRepository.get();

  if (!configuracao) {
    throw new DomainError(
      "CONFIGURACAO_NAO_ENCONTRADA",
      "Configuracao do restaurante nao encontrada.",
    );
  }

  if (!configuracao.pedidosAtivos) {
    throw new DomainError(
      "PEDIDOS_INATIVOS",
      configuracao.motivoFechamento ?? "Pedidos indisponiveis no momento.",
    );
  }

  assertDentroHorarioCorte(configuracao.horarioCorte, agora);
  assertTipoEntregaPermitido(configuracao.modoEntrega, checkout.tipoEntrega);

  const cardapioDiaIds = checkout.itens.map((item) => item.cardapioDiaId);
  const [cardapios, reservasAtivas, zonaEntrega] = await Promise.all([
    cardapioRepository.findManyByIds(cardapioDiaIds),
    pedidoRepository.listReservasAtivas(cardapioDiaIds, agora),
    checkout.zonaEntregaId
      ? zonaEntregaRepository.findById(checkout.zonaEntregaId)
      : Promise.resolve(null),
  ]);

  const reservas = mapearReservasAtivas(reservasAtivas);
  assertItensDisponiveis(cardapios, reservas, checkout.itens);

  const subtotal = somarItensPedido(checkout.itens, cardapios);
  const taxaEntrega = calcularTaxaEntrega({
    tipoEntrega: checkout.tipoEntrega,
    zonaEntrega,
    configuracao,
  });
  const valorTotal = subtotal.plus(taxaEntrega);

  if (configuracao.pedidoMinimo && subtotal.lt(configuracao.pedidoMinimo)) {
    throw new DomainError(
      "PEDIDO_MINIMO_NAO_ATINGIDO",
      "O pedido nao atingiu o valor minimo.",
    );
  }

  const dataEntregaOuRetirada = getTodayDateOnlyInSaoPaulo(agora);
  const expiraEm = addMinutes(agora, PEDIDO_EXPIRACAO_MINUTOS);

  const pedidoCriado = await prisma.$transaction(
    async (tx) => {
      const pedidos = createPedidoRepository(tx);
      const pagamentos = createPagamentoRepository(tx);
      const cardapiosTx = createCardapioRepository(tx);

      const cardapiosAtualizados =
        await cardapiosTx.findManyByIds(cardapioDiaIds);
      const reservasAtualizadas = await pedidos.listReservasAtivas(
        cardapioDiaIds,
        agora,
      );

      assertItensDisponiveis(
        cardapiosAtualizados,
        mapearReservasAtivas(reservasAtualizadas),
        checkout.itens,
      );

      const pedido = await pedidos.create({
        clienteNome: checkout.clienteNome,
        clienteTelefone: checkout.clienteTelefone,
        clienteEmail: checkout.clienteEmail,
        tipoEntrega: checkout.tipoEntrega,
        enderecoRua: checkout.enderecoRua,
        enderecoNumero: checkout.enderecoNumero,
        enderecoBairro: checkout.enderecoBairro,
        enderecoComplemento: checkout.enderecoComplemento,
        zonaEntrega: checkout.zonaEntregaId
          ? { connect: { id: checkout.zonaEntregaId } }
          : undefined,
        taxaEntrega,
        valorTotal,
        dataEntregaOuRetirada,
        expiraEm,
        itens: {
          create: checkout.itens.map((item) => {
            const cardapio = cardapiosAtualizados.find(
              (cardapioAtualizado) =>
                cardapioAtualizado.id === item.cardapioDiaId,
            );

            if (!cardapio) {
              throw new DomainError(
                "ITEM_INDISPONIVEL",
                "Um dos itens selecionados nao esta disponivel.",
              );
            }

            return {
              quantidade: item.quantidade,
              precoUnitario: cardapio.precoDoDia,
              observacoes: item.observacoes,
              cardapioDia: { connect: { id: item.cardapioDiaId } },
            };
          }),
        },
      });

      await pagamentos.create({
        pedido: { connect: { id: pedido.id } },
        metodo: "PIX",
        status: "PENDENTE",
        gateway: "mercadopago",
        externalReference: pedido.id,
        valorEsperado: valorTotal,
      });

      return pedido;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    },
  );

  const pagamentoPix = await criarPagamentoPix({
    pedidoId: pedidoCriado.id,
    codigoPedido: pedidoCriado.codigoPedido,
    valor: valorTotal,
    clienteEmail: pedidoCriado.clienteEmail,
  });

  await createPagamentoRepository().updateByPedidoId(pedidoCriado.id, {
    gatewayPaymentId: pagamentoPix.gatewayPaymentId,
    qrCode: pagamentoPix.qrCode,
    qrCodeBase64: pagamentoPix.qrCodeBase64,
  });

  return pedidoRepository.findById(pedidoCriado.id);
}
