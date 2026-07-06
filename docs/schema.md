# Schema de Dados
## Sistema de Cardápio e Pedidos — Marmitas

**Status:** Rascunho validado para transformar em `schema.prisma`  
**Referência:** `docs/regras-de-negocio.md`, `docs/arquitetura.md`  
**Última atualização:** 06/07/2026

---

## 1. Visão Geral das Entidades

```txt
Admin

Categoria ──< Prato ──< CardapioDia
Pedido ──< ItemPedido >── CardapioDia
Pedido ──1:1── Pagamento
Pedido >── ZonaEntrega
ConfiguracaoRestaurante (singleton)
```

### Decisão do MVP

Cliente não tem conta nem login.

Os dados do cliente ficam embutidos diretamente no `Pedido`:

- nome;
- telefone;
- email opcional;
- endereço, se for entrega.

Se futuramente existir área do cliente com histórico, esses campos poderão ser extraídos para uma tabela `Cliente`.

---

## 2. Entidades Detalhadas

## `Admin`

Único perfil autenticado no sistema no MVP.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | String | PK — `cuid()` |
| `nome` | String | Nome do administrador |
| `email` | String | Único — usado no login |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

Não há enum `Role` no MVP. Se existe registro em `Admin`, a pessoa é administradora.

---

## `ConfiguracaoRestaurante`

Tabela singleton com uma única linha de configuração geral.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | String | PK fixo, ex: `default` |
| `nomeRestaurante` | String | Nome exibido no cardápio |
| `modoEntrega` | Enum `ModoEntrega` | `DELIVERY`, `RETIRADA`, `AMBOS` |
| `horarioCorte` | String | Formato `HH:mm`, interpretado em `America/Sao_Paulo` |
| `pedidosAtivos` | Boolean | Loja aberta/fechada manualmente |
| `motivoFechamento` | String? | Exibido quando `pedidosAtivos = false` |
| `taxaEntregaPadrao` | Decimal? | Usada se não houver zona específica |
| `pedidoMinimo` | Decimal? | Valor mínimo para checkout |
| `tempoPreparoMinutos` | Int? | Estimativa para retirada |
| `tempoEntregaMinutos` | Int? | Estimativa para entrega |
| `whatsappContato` | String? | Contato exibido no checkout/rodapé |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

---

## `ZonaEntrega`

Define taxa fixa por bairro/região.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | String | PK — `cuid()` |
| `nome` | String | Ex: `Centro`, `Zona Norte` |
| `taxaEntrega` | Decimal | Taxa fixa da zona |
| `ativo` | Boolean | Permite desativar sem apagar histórico |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

Relação:

```txt
ZonaEntrega 1:N Pedido
```

---

## `Categoria`

Categorias de exibição do cardápio.

Exemplos:

- Marmitas;
- Bebidas;
- Sobremesas;
- Adicionais.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | String | PK — `cuid()` |
| `nome` | String | Nome exibido ao cliente |
| `ordem` | Int | Ordem de exibição no cardápio |
| `ativo` | Boolean | Soft delete |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

Relação:

```txt
Categoria 1:N Prato
```

Decisão: categorias vêm com seed inicial, mas podem ser criadas/editadas/desativadas pelo admin.

---

## `Prato`

Catálogo base de pratos/produtos que podem aparecer no cardápio do dia.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | String | PK — `cuid()` |
| `nome` | String | Nome do prato |
| `descricao` | String | Descrição do prato |
| `fotoUrl` | String? | URL da imagem |
| `categoriaId` | String | FK → `Categoria` |
| `precoBase` | Decimal | Preço sugerido |
| `ativo` | Boolean | Soft delete |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

Relação:

```txt
Prato N:1 Categoria
Prato 1:N CardapioDia
```

---

## `CardapioDia`

Define o que está disponível para venda em uma data específica.

É a entidade central do sistema.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | String | PK — `cuid()` |
| `pratoId` | String | FK → `Prato` |
| `data` | Date | Data de venda/entrega |
| `precoDoDia` | Decimal | Preço praticado no dia |
| `quantidadeDisponivel` | Int | Total produzido/disponível |
| `quantidadeVendida` | Int | Incrementado após pagamento aprovado |
| `ativo` | Boolean | Admin pode ocultar sem apagar histórico |
| `destaque` | Boolean | Define destaque na listagem |
| `ordem` | Int? | Ordem opcional dentro do cardápio |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

### Constraint

Único por:

```txt
(pratoId, data)
```

Não pode haver o mesmo prato duplicado no mesmo dia.

### Disponibilidade real

```txt
disponivelReal = quantidadeDisponivel - quantidadeVendida - quantidadeReservada
```

`quantidadeReservada` não é coluna própria.

Ela é calculada somando `ItemPedido.quantidade` de pedidos:

```txt
Pedido.status = AGUARDANDO_PAGAMENTO
Pedido.expiraEm > now
```

Isso evita dessincronia e libera automaticamente a reserva quando o pedido expira.

---

## `Pedido`

Representa um pedido completo feito pelo cliente.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | String | PK — `cuid()` |
| `codigoPedido` | Int | Código amigável para cliente/admin, ex: `1024` |
| `clienteNome` | String | Nome informado no checkout |
| `clienteTelefone` | String | Telefone/WhatsApp |
| `clienteEmail` | String? | Opcional para notificações |
| `status` | Enum `StatusPedido` | Estado atual do pedido |
| `tipoEntrega` | Enum `TipoEntregaPedido` | `DELIVERY` ou `RETIRADA` |
| `enderecoRua` | String? | Nulo se retirada |
| `enderecoNumero` | String? | Nulo se retirada |
| `enderecoBairro` | String? | Nulo se retirada |
| `enderecoComplemento` | String? | Opcional |
| `zonaEntregaId` | String? | FK → `ZonaEntrega`, nulo se retirada |
| `taxaEntrega` | Decimal | Congelada no momento do pedido |
| `valorTotal` | Decimal | Soma dos itens + taxa, congelado |
| `dataEntregaOuRetirada` | Date | Sempre data corrente no MVP |
| `expiraEm` | DateTime | `criadoEm + 15min` |
| `canceladoEm` | DateTime? | Preenchido se status virar `CANCELADO` |
| `motivoCancelamento` | String? | Motivo informado pelo cliente/admin |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

Relações:

```txt
Pedido 1:N ItemPedido
Pedido 1:1 Pagamento
Pedido N:1 ZonaEntrega
```

Não existe `userId` nem `enderecoId` no MVP, porque cliente não possui conta nem entidade própria.

---

## `ItemPedido`

Itens que compõem um pedido.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | String | PK — `cuid()` |
| `pedidoId` | String | FK → `Pedido` |
| `cardapioDiaId` | String | FK → `CardapioDia` |
| `quantidade` | Int | Quantidade comprada |
| `precoUnitario` | Decimal | Congelado no momento do pedido |
| `observacoes` | String? | Ex: `sem cebola` |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

Relações:

```txt
ItemPedido N:1 Pedido
ItemPedido N:1 CardapioDia
```

---

## `Pagamento`

Registro da transação financeira, 1:1 com `Pedido`.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | String | PK — `cuid()` |
| `pedidoId` | String | FK único → `Pedido` |
| `metodo` | Enum `MetodoPagamento` | No MVP usa apenas `PIX` |
| `status` | Enum `StatusPagamento` | Estado do pagamento |
| `gateway` | String | Ex: `mercadopago` |
| `gatewayPaymentId` | String? | ID do pagamento no Mercado Pago, único quando preenchido |
| `externalReference` | String | Igual ao `pedidoId`, enviado ao gateway |
| `qrCode` | String? | Pix copia-e-cola |
| `qrCodeBase64` | String? | Imagem do QR Code em base64 |
| `valorEsperado` | Decimal | Valor do pedido no momento da cobrança |
| `valorPago` | Decimal? | Valor confirmado pelo gateway |
| `confirmadoEm` | DateTime? | Preenchido quando aprovado |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data de atualização |

### Segurança

O webhook não deve confiar apenas no payload recebido.

Após validar a assinatura, o sistema consulta a API do Mercado Pago usando `gatewayPaymentId` e confirma:

- status aprovado;
- valor pago;
- `externalReference`;
- pedido correspondente;
- idempotência.

---

## 3. Enums Consolidados

```prisma
enum ModoEntrega {
  DELIVERY
  RETIRADA
  AMBOS
}

enum TipoEntregaPedido {
  DELIVERY
  RETIRADA
}

enum StatusPedido {
  AGUARDANDO_PAGAMENTO
  EXPIRADO
  CANCELADO
  CONFIRMADO
  EM_PREPARO
  PRONTO_PARA_RETIRADA
  SAIU_PARA_ENTREGA
  ENTREGUE
  RETIRADO
}

enum MetodoPagamento {
  PIX
  CARTAO // reservado para fase 2, não usado no MVP
}

enum StatusPagamento {
  PENDENTE
  APROVADO
  RECUSADO
  ESTORNADO
}
```

---

## 4. Índices Importantes

### `Admin`

```txt
email unique
```

### `Categoria`

```txt
ativo
ordem
```

### `Prato`

```txt
categoriaId
ativo
```

### `CardapioDia`

```txt
data
ativo
(pratoId, data) unique
```

### `Pedido`

```txt
codigoPedido unique
status
expiraEm
createdAt
tipoEntrega
zonaEntregaId
```

### `ItemPedido`

```txt
pedidoId
cardapioDiaId
```

### `Pagamento`

```txt
pedidoId unique
gatewayPaymentId unique
externalReference
status
```

---

## 5. Regras Importantes para o Prisma

### Decimal

Valores monetários devem usar `Decimal`, não `Float`.

### Datas

- Timestamps (`createdAt`, `updatedAt`, `expiraEm`, `confirmadoEm`) ficam em UTC.
- `horarioCorte` fica como string `HH:mm` e é interpretado em `America/Sao_Paulo` pela camada de service.

### IDs

Uso padrão:

```txt
cuid()
```

Não há necessidade de UUID no MVP.

### Código do pedido

`codigoPedido` deve ser amigável e incremental.

Pode ser implementado com sequência no banco, contador auxiliar ou lógica segura no service. O importante é não expor o `cuid()` para o cliente como identificador principal.

---

## 6. Pontos de Refatoração Futura

Se o projeto evoluir, considerar:

- tabela `Cliente` para histórico e login;
- tabela `Endereco` vinculada ao cliente;
- tabela `Funcionario` ou `User` com roles;
- suporte multi-restaurante com `restaurantId` em todas as entidades principais;
- tabela de assinatura/plano;
- tabela de cupom;
- versionamento de configurações por dia;
- painel separado de cozinha/operação;
- pagamento via cartão.
