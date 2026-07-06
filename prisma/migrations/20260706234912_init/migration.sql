-- CreateEnum
CREATE TYPE "ModoEntrega" AS ENUM ('DELIVERY', 'RETIRADA', 'AMBOS');

-- CreateEnum
CREATE TYPE "TipoEntregaPedido" AS ENUM ('DELIVERY', 'RETIRADA');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('AGUARDANDO_PAGAMENTO', 'EXPIRADO', 'CANCELADO', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_PARA_RETIRADA', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'RETIRADO');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('PIX', 'CARTAO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'ESTORNADO');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracao_restaurante" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "modoEntrega" "ModoEntrega" NOT NULL DEFAULT 'AMBOS',
    "horarioCorte" TEXT NOT NULL,
    "pedidosAtivos" BOOLEAN NOT NULL DEFAULT true,
    "motivoFechamento" TEXT,
    "pedidoMinimo" DECIMAL(10,2),
    "taxaEntregaPadrao" DECIMAL(10,2),
    "tempoPreparoMinutos" INTEGER,
    "tempoEntregaMinutos" INTEGER,
    "whatsappContato" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracao_restaurante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pratos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "precoBase" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardapios_dia" (
    "id" TEXT NOT NULL,
    "pratoId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "precoDoDia" DECIMAL(10,2) NOT NULL,
    "quantidadeDisponivel" INTEGER NOT NULL,
    "quantidadeVendida" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cardapios_dia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas_entrega" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "taxaEntrega" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zonas_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "codigoPedido" SERIAL NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "clienteTelefone" TEXT NOT NULL,
    "clienteEmail" TEXT,
    "tipoEntrega" "TipoEntregaPedido" NOT NULL,
    "enderecoRua" TEXT,
    "enderecoNumero" TEXT,
    "enderecoBairro" TEXT,
    "enderecoComplemento" TEXT,
    "zonaEntregaId" TEXT,
    "taxaEntrega" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "dataEntregaOuRetirada" DATE NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "canceladoEm" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "cardapioDiaId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "metodo" "MetodoPagamento" NOT NULL DEFAULT 'PIX',
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "gateway" TEXT NOT NULL DEFAULT 'mercadopago',
    "gatewayPaymentId" TEXT,
    "externalReference" TEXT NOT NULL,
    "qrCode" TEXT,
    "qrCodeBase64" TEXT,
    "valorEsperado" DECIMAL(10,2) NOT NULL,
    "valorPago" DECIMAL(10,2),
    "confirmadoEm" TIMESTAMP(3),
    "estornadoEm" TIMESTAMP(3),
    "recusadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "categorias_ativo_idx" ON "categorias"("ativo");

-- CreateIndex
CREATE INDEX "categorias_ordem_idx" ON "categorias"("ordem");

-- CreateIndex
CREATE INDEX "pratos_categoriaId_idx" ON "pratos"("categoriaId");

-- CreateIndex
CREATE INDEX "pratos_ativo_idx" ON "pratos"("ativo");

-- CreateIndex
CREATE INDEX "cardapios_dia_data_idx" ON "cardapios_dia"("data");

-- CreateIndex
CREATE INDEX "cardapios_dia_ativo_idx" ON "cardapios_dia"("ativo");

-- CreateIndex
CREATE INDEX "cardapios_dia_destaque_idx" ON "cardapios_dia"("destaque");

-- CreateIndex
CREATE UNIQUE INDEX "cardapios_dia_pratoId_data_key" ON "cardapios_dia"("pratoId", "data");

-- CreateIndex
CREATE INDEX "zonas_entrega_ativo_idx" ON "zonas_entrega"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_codigoPedido_key" ON "pedidos"("codigoPedido");

-- CreateIndex
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "pedidos_expiraEm_idx" ON "pedidos"("expiraEm");

-- CreateIndex
CREATE INDEX "pedidos_clienteTelefone_idx" ON "pedidos"("clienteTelefone");

-- CreateIndex
CREATE INDEX "pedidos_dataEntregaOuRetirada_idx" ON "pedidos"("dataEntregaOuRetirada");

-- CreateIndex
CREATE INDEX "itens_pedido_pedidoId_idx" ON "itens_pedido"("pedidoId");

-- CreateIndex
CREATE INDEX "itens_pedido_cardapioDiaId_idx" ON "itens_pedido"("cardapioDiaId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_pedidoId_key" ON "pagamentos"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_gatewayPaymentId_key" ON "pagamentos"("gatewayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_externalReference_key" ON "pagamentos"("externalReference");

-- CreateIndex
CREATE INDEX "pagamentos_status_idx" ON "pagamentos"("status");

-- CreateIndex
CREATE INDEX "pagamentos_pedidoId_idx" ON "pagamentos"("pedidoId");

-- AddForeignKey
ALTER TABLE "pratos" ADD CONSTRAINT "pratos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardapios_dia" ADD CONSTRAINT "cardapios_dia_pratoId_fkey" FOREIGN KEY ("pratoId") REFERENCES "pratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_zonaEntregaId_fkey" FOREIGN KEY ("zonaEntregaId") REFERENCES "zonas_entrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_cardapioDiaId_fkey" FOREIGN KEY ("cardapioDiaId") REFERENCES "cardapios_dia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
