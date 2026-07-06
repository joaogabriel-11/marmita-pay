# Schema de Dados

**Status:** Rascunho inicial — será refinado ao escrever o `schema.prisma` real
**Referência:** `docs/regras-de-negocio.md`, `docs/arquitetura.md`

Este documento descreve o modelo de dados em nível conceitual, antes da sintaxe final do Prisma. Serve como referência rápida sem precisar abrir o `schema.prisma` inteiro.

---

## 1. Visão Geral das Entidades

```
User ──< Endereco
User ──< Pedido >── ItemPedido >── CardapioDia >── Prato
Pedido ──1:1── Pagamento
Pedido >── ZonaEntrega
ConfiguracaoRestaurante (tabela única, singleton)
```

---

## 2. Entidades Detalhadas

### `User`

Representa clientes e administradores.

| Campo       | Tipo                    | Observação        |
| ----------- | ----------------------- | ----------------- |
| `id`        | String (cuid)           | PK                |
| `nome`      | String                  |                   |
| `email`     | String                  | Único             |
| `role`      | Enum `CLIENTE`, `ADMIN` | Default `CLIENTE` |
| `createdAt` | DateTime                |                   |

Relação: `1:N` com `Endereco`, `1:N` com `Pedido`.

---

### `Endereco`

Endereços salvos do cliente (pode ter mais de um).

| Campo                                    | Tipo    | Observação                                    |
| ---------------------------------------- | ------- | --------------------------------------------- |
| `id`                                     | String  | PK                                            |
| `userId`                                 | String  | FK → `User`                                   |
| `rua`, `numero`, `bairro`, `complemento` | String  |                                               |
| `zonaEntregaId`                          | String? | FK → `ZonaEntrega` — usado para calcular taxa |

---

### `ZonaEntrega`

Cadastrada pelo admin. Define taxa fixa por região.

| Campo         | Tipo    | Observação                                  |
| ------------- | ------- | ------------------------------------------- |
| `id`          | String  | PK                                          |
| `nome`        | String  | Ex: "Centro", "Zona Norte"                  |
| `taxaEntrega` | Decimal |                                             |
| `ativo`       | Boolean | Permite desativar zona sem apagar histórico |

---

### `Prato`

Catálogo de pratos que **podem** aparecer no cardápio (não é o cardápio do dia em si).

| Campo       | Tipo    | Observação                                             |
| ----------- | ------- | ------------------------------------------------------ |
| `id`        | String  | PK                                                     |
| `nome`      | String  |                                                        |
| `descricao` | String  |                                                        |
| `fotoUrl`   | String? |                                                        |
| `categoria` | String  | Ex: "Prato principal", "Bebida", "Sobremesa"           |
| `precoBase` | Decimal | Preço sugerido — pode ser sobrescrito no `CardapioDia` |
| `ativo`     | Boolean | Soft delete                                            |

---

### `CardapioDia`

Define o que está disponível para venda em uma data específica, com quantidade limitada. **Esta é a entidade central do sistema.**

| Campo                  | Tipo     | Observação                                              |
| ---------------------- | -------- | ------------------------------------------------------- |
| `id`                   | String   | PK                                                      |
| `pratoId`              | String   | FK → `Prato`                                            |
| `data`                 | Date     | Data de venda/entrega                                   |
| `precoDoDia`           | Decimal  | Preço praticado nesse dia (pode diferir do `precoBase`) |
| `quantidadeDisponivel` | Int      | Quantidade total produzida                              |
| `quantidadeVendida`    | Int      | Incrementado apenas na confirmação de pagamento         |
| `createdAt`            | DateTime |                                                         |

**Constraint:** único por (`pratoId`, `data`) — não pode haver o mesmo prato duplicado no mesmo dia.

**Regra crítica:** `quantidadeVendida` nunca pode ultrapassar `quantidadeDisponivel`. Essa verificação ocorre dentro da transação de confirmação de pagamento (ver `arquitetura.md`, seção 4), não a nível de constraint de banco, porque a decisão de "esgotado" depende de lógica de negócio (ex: admin pode aumentar a quantidade manualmente depois).

---

### `Pedido`

Representa um pedido completo do cliente.

| Campo                   | Tipo                        | Observação                                                                                                   |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `id`                    | String                      | PK                                                                                                           |
| `userId`                | String                      | FK → `User`                                                                                                  |
| `status`                | Enum                        | `AGUARDANDO_PAGAMENTO`, `CONFIRMADO`, `EM_PREPARO`, `SAIU_PARA_ENTREGA`, `ENTREGUE`, `RETIRADO`, `CANCELADO` |
| `tipoEntrega`           | Enum `DELIVERY`, `RETIRADA` | Definido no checkout (respeitando `ConfiguracaoRestaurante.modoEntrega`)                                     |
| `enderecoId`            | String?                     | FK → `Endereco` — nulo se for retirada                                                                       |
| `zonaEntregaId`         | String?                     | FK → `ZonaEntrega` — nulo se for retirada                                                                    |
| `taxaEntrega`           | Decimal                     | Congelada no momento do pedido                                                                               |
| `valorTotal`            | Decimal                     | Soma dos itens + taxa, congelado                                                                             |
| `dataEntregaOuRetirada` | Date                        | Sempre a data corrente (não há pedido futuro nesta versão)                                                   |
| `criadoEm`              | DateTime                    |                                                                                                              |
| `expiraEm`              | DateTime                    | `criadoEm + 15min` — usado pelo job de expiração                                                             |

---

### `ItemPedido`

Itens que compõem um pedido.

| Campo           | Tipo    | Observação                                                          |
| --------------- | ------- | ------------------------------------------------------------------- |
| `id`            | String  | PK                                                                  |
| `pedidoId`      | String  | FK → `Pedido`                                                       |
| `cardapioDiaId` | String  | FK → `CardapioDia`                                                  |
| `quantidade`    | Int     |                                                                     |
| `precoUnitario` | Decimal | Congelado no momento da criação (cópia de `CardapioDia.precoDoDia`) |
| `observacoes`   | String? | Ex: "sem cebola"                                                    |

---

### `Pagamento`

Registro da transação financeira, 1:1 com `Pedido`.

| Campo                  | Tipo                                                 | Observação                               |
| ---------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `id`                   | String                                               | PK                                       |
| `pedidoId`             | String                                               | FK único → `Pedido`                      |
| `metodo`               | Enum `PIX`, `CARTAO`                                 |                                          |
| `status`               | Enum `PENDENTE`, `APROVADO`, `RECUSADO`, `ESTORNADO` |                                          |
| `gatewayTransactionId` | String                                               | Único — chave de idempotência do webhook |
| `valorPago`            | Decimal                                              |                                          |
| `confirmadoEm`         | DateTime?                                            | Preenchido quando o webhook confirma     |

---

### `ConfiguracaoRestaurante`

Tabela singleton (uma única linha) com as configurações gerais.

| Campo              | Tipo                                 | Observação                                      |
| ------------------ | ------------------------------------ | ----------------------------------------------- |
| `id`               | String                               | PK fixo (sempre o mesmo valor, ex: `"default"`) |
| `modoEntrega`      | Enum `DELIVERY`, `RETIRADA`, `AMBOS` |                                                 |
| `horarioCorte`     | String (HH:mm)                       | Ex: `"10:00"`                                   |
| `aceitaPedidoHoje` | Boolean                              | Override manual do admin                        |
| `pedidoMinimo`     | Decimal?                             |                                                 |
| `whatsappContato`  | String?                              |                                                 |

---

## 3. Enums Consolidados

```prisma
enum Role {
  CLIENTE
  ADMIN
}

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
  CONFIRMADO
  EM_PREPARO
  SAIU_PARA_ENTREGA
  ENTREGUE
  RETIRADO
  CANCELADO
}

enum MetodoPagamento {
  PIX
  CARTAO
}

enum StatusPagamento {
  PENDENTE
  APROVADO
  RECUSADO
  ESTORNADO
}
```

---

## 4. Índices Importantes (performance)

- `CardapioDia`: índice em `data` (consulta diária constante).
- `Pedido`: índice em `userId` (histórico do cliente) e em `status` (painel admin filtra por status).
- `Pagamento`: índice único em `gatewayTransactionId` (idempotência do webhook).

---

## 5. Pontos em Aberto

- [ ] Confirmar se `ConfiguracaoRestaurante` singleton é suficiente ou se algum campo deveria ser versionado por data (ex: histórico de mudança de horário de corte)
- [ ] Definir se `Prato.categoria` vira uma tabela `Categoria` separada (melhor para filtros no futuro) ou permanece como string simples no MVP
- [ ] Confirmar geração de `id`: `cuid()` (padrão Prisma) é suficiente, não há necessidade de UUID
