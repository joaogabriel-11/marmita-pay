# Arquitetura Técnica
## Sistema de Cardápio e Pedidos — Marmitas

**Status:** Rascunho validado para início do MVP  
**Referência de regras de negócio:** `docs/regras-de-negocio.md`  
**Última atualização:** 06/07/2026

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Motivo da escolha |
|---|---|---|
| Frontend/Backend | Next.js 16 (App Router) | Full-stack em um único projeto, Server Actions para mutações internas e Route Handlers para webhooks. |
| UI | React 19 + Tailwind CSS 4 | Produtividade, consistência visual e facilidade para criar interface responsiva. |
| Linguagem | TypeScript | Tipagem estática reduz erros em regras sensíveis, como estoque, pedido e pagamento. |
| ORM | Prisma 6 | Migrations versionadas, type-safety e suporte a transações atômicas. |
| Banco de dados | PostgreSQL (Supabase) | Banco relacional com transações ACID, necessário para evitar overselling. |
| Autenticação | NextAuth.js | Login do admin com provider Google e possível fallback por credentials. |
| Pagamento | Mercado Pago — Pix no MVP | Gateway adequado ao contexto brasileiro e ao problema principal do restaurante. |
| Email transacional | Resend | API simples para notificações de confirmação/cancelamento. |
| Deploy | Vercel (Hobby) | Deploy automático por branch/PR e boa integração com Next.js. |
| Testes | Vitest | Testes unitários e de integração das regras críticas. |

---

## 2. Decisões de Arquitetura

### Server Actions

O projeto usa **Server Actions** do Next.js para a maioria das mutações internas:

- criar pedido;
- cadastrar prato;
- montar cardápio do dia;
- atualizar status do pedido;
- editar configurações do restaurante;
- cadastrar zonas de entrega.

### Route Handlers

Route Handlers (`/app/api/...`) ficam reservados para pontos que precisam de URL HTTP tradicional:

- webhook do Mercado Pago;
- expiração sob demanda de pedidos pendentes;
- endpoints futuros para app mobile ou integrações externas.

---

## 3. Estrutura de Pastas

```txt
/app
  /(public)
    /cardapio
    /carrinho
    /checkout
    /pedido/[codigo]

  /(admin)
    /admin
      /login
      /dashboard
      /cardapio
      /pratos
      /categorias
      /pedidos
      /configuracoes
      /zonas-entrega
      /relatorios

  /api
    /webhooks
      /mercado-pago
        /route.ts
    /pedidos
      /[codigo]
        /status
          /route.ts

/lib
  /auth
    auth.ts
    permissions.ts

  /services
    verificarHorarioCorte.ts
    verificarDisponibilidade.ts
    calcularTaxaEntrega.ts
    criarPedidoComPix.ts
    processarWebhookPagamento.ts
    expirarPedidosPendentes.ts
    atualizarStatusPedido.ts

  /repositories
    adminRepository.ts
    categoriaRepository.ts
    pratoRepository.ts
    cardapioRepository.ts
    pedidoRepository.ts
    pagamentoRepository.ts
    configuracaoRepository.ts
    zonaEntregaRepository.ts

  /validations
    checkoutSchema.ts
    pratoSchema.ts
    cardapioDiaSchema.ts
    configuracaoSchema.ts
    zonaEntregaSchema.ts

  /mercado-pago
    client.ts
    criarPagamentoPix.ts
    consultarPagamento.ts
    validarWebhook.ts

  /email
    resend.ts
    templates.ts

  /utils
    money.ts
    dates.ts
    phone.ts

/prisma
  schema.prisma
  /migrations
  seed.ts

/docs
  regras-de-negocio.md
  arquitetura.md
  schema.md

/tests
  /unit
  /integration
```

### Área de cliente

A área `/(cliente)` **não existe no MVP**. Cliente compra sem login.

Fase 2 poderá adicionar:

```txt
/(cliente)
  /pedidos
  /perfil
```

---

## 4. Regra de Dependência

Fluxo recomendado:

```txt
Componentes / Server Actions
        ↓
Services
        ↓
Repositories
        ↓
Prisma
```

### Services

Contêm regras de negócio:

- verificar horário de corte;
- calcular disponibilidade real;
- validar pedido mínimo;
- calcular taxa de entrega;
- criar pedido com reserva de estoque;
- processar confirmação de pagamento;
- expirar pedidos pendentes.

### Repositories

São a única camada que acessa o Prisma diretamente.

### Exceção prática

Server Actions simples podem chamar repositories diretamente quando não existe regra de negócio relevante.

Exemplo aceitável:

```txt
Criar categoria simples → Server Action → categoriaRepository
```

Exemplo que deve passar por service:

```txt
Criar pedido com Pix → Server Action → criarPedidoComPix service → repositories
```

Regra principal: lógica de negócio crítica não deve ficar espalhada em Server Actions.

---

## 5. Autenticação e Autorização

### MVP

- Apenas o admin autentica.
- Cliente não tem conta.
- Login do admin via NextAuth.js.
- Provider principal: Google.
- Credentials/email-senha fica como ponto em aberto.

### Proteção de rotas

Middleware protege a área `/admin`.

Porém, toda Server Action administrativa também deve verificar autorização internamente.

Motivo: middleware impede navegação indevida pela UI, mas não deve ser a única barreira de segurança para mutações.

---

## 6. Fluxo Crítico: Criação de Pedido com Reserva de Estoque

Esse é o ponto mais delicado do sistema.

Dois clientes podem tentar comprar a última marmita disponível ao mesmo tempo. Por isso, a criação do pedido precisa acontecer dentro de uma transação.

### Sequência

1. Cliente envia checkout.
2. Server Action chama `criarPedidoComPix`.
3. Service valida:
   - pedidos ativos;
   - horário de corte;
   - tipo de entrega permitido;
   - endereço/zona de entrega;
   - pedido mínimo;
   - preço real dos itens;
   - disponibilidade real dos itens.
4. Dentro de uma transação:
   - revalida disponibilidade;
   - cria `Pedido` com status `AGUARDANDO_PAGAMENTO`;
   - cria `ItemPedido` com preço congelado;
   - cria `Pagamento` pendente;
   - define `expiraEm = now + 15min`.
5. Sistema cria cobrança Pix no Mercado Pago.
6. Sistema salva `gatewayPaymentId`, `qrCode`, `qrCodeBase64` e `externalReference`.
7. Cliente visualiza QR Code e Pix copia-e-cola.

### Disponibilidade real

```txt
disponivelReal = quantidadeDisponivel - quantidadeVendida - quantidadeReservada
```

`quantidadeReservada` é calculada a partir de pedidos `AGUARDANDO_PAGAMENTO` com `expiraEm > now`.

Não existe coluna `quantidadeReservada` no banco para evitar dessincronia.

---

## 7. Fluxo Crítico: Webhook de Pagamento

Endpoint:

```txt
/api/webhooks/mercado-pago
```

### Sequência

1. Mercado Pago envia notificação.
2. Handler valida assinatura/origem.
3. Handler extrai o ID do pagamento.
4. Handler verifica idempotência pelo `gatewayPaymentId`.
5. Handler consulta a API do Mercado Pago para confirmar os dados reais.
6. Handler valida:
   - status aprovado;
   - `externalReference` correspondente ao pedido;
   - valor pago igual ao valor esperado;
   - pagamento ainda não processado.
7. Dentro de uma transação:
   - atualiza `Pagamento.status` para `APROVADO`;
   - preenche `valorPago` e `confirmadoEm`;
   - muda `Pedido.status` para `CONFIRMADO`;
   - incrementa `CardapioDia.quantidadeVendida` para cada item do pedido.
8. Dispara email de confirmação, se o cliente informou email.

### Idempotência

O mesmo webhook pode ser enviado mais de uma vez. O sistema deve ignorar eventos já processados.

`gatewayPaymentId` deve ser único.

---

## 8. Fluxo Crítico: Expiração de Pedido

Pedidos não pagos em até 15 minutos devem expirar.

### Sequência

1. O sistema executa a expiração sob demanda em fluxos críticos:
   - abertura do cardápio;
   - tentativa de checkout;
   - consulta da tela de status do pedido.
2. O service busca pedidos:

```txt
status = AGUARDANDO_PAGAMENTO
expiraEm < now
```

3. Atualiza status para `EXPIRADO`.
4. Atualiza pagamento para `RECUSADO`.

Como a reserva é calculada dinamicamente a partir dos pedidos pendentes e não expirados, mudar o status para `EXPIRADO` libera a reserva automaticamente.

### Timezone

`expiraEm` é timestamp absoluto salvo em UTC. A expiração não precisa aplicar timezone.

Já regras como `horario_corte` precisam usar `America/Sao_Paulo` na camada de services.

---

## 9. Fluxo de Status do Pedido

Admin pode mover pedidos conforme regras:

```txt
CONFIRMADO → EM_PREPARO
EM_PREPARO + RETIRADA → PRONTO_PARA_RETIRADA → RETIRADO
EM_PREPARO + DELIVERY → SAIU_PARA_ENTREGA → ENTREGUE
```

O sistema deve bloquear transições inválidas.

Exemplos:

- pedido de retirada não pode ir para `SAIU_PARA_ENTREGA`;
- pedido de entrega não pode ir para `PRONTO_PARA_RETIRADA`;
- pedido `EXPIRADO` não pode voltar para `CONFIRMADO` manualmente;
- pedido `CANCELADO` não deve voltar para produção.

---

## 10. Testes

| Tipo | Ferramenta | Foco |
|---|---|---|
| Unitário | Vitest | Services puros, regras de corte, disponibilidade, taxa e status |
| Integração | Vitest + banco de teste | Repositories, transações e concorrência de estoque |
| E2E | Playwright | Fase 2 — fluxo completo do cliente ao painel admin |

### Testes prioritários do MVP

- Não criar pedido após horário de corte.
- Não criar pedido com loja fechada.
- Não criar pedido abaixo do mínimo.
- Não criar pedido sem disponibilidade.
- Reservar estoque ao gerar Pix.
- Expirar pedido após 15 minutos.
- Liberar reserva após expiração.
- Confirmar pedido via webhook válido.
- Ignorar webhook duplicado.
- Bloquear webhook com valor divergente.
- Bloquear transição inválida de status.

---

## 11. CI/CD

GitHub Actions em Pull Requests:

```txt
lint
format check
type-check
test
prisma generate
```

Deploy:

- preview automático em PR;
- produção na branch `main`;
- variáveis sensíveis configuradas na Vercel.

---

## 12. Segurança

Variáveis sensíveis:

```txt
DATABASE_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
RESEND_API_KEY
```

Regras:

- nunca commitar `.env`;
- manter `.env.example` atualizado;
- validar assinatura do webhook;
- revalidar todos os preços no servidor;
- revalidar disponibilidade no servidor;
- ignorar totais vindos do client;
- aplicar rate limit no checkout;
- verificar autorização em toda Server Action de admin.

---

## 13. Pontos em Aberto

- [ ] Definir ferramenta de rate limit compatível com Vercel Hobby.
- [ ] Confirmar frequência viável do Vercel Cron no plano usado.
- [ ] Decidir se login do admin será apenas Google ou também credentials.
- [ ] Definir se pagamento expirado no gateway será cancelado ativamente via API ou apenas expirado internamente.
