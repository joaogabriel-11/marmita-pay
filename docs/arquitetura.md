# Arquitetura Técnica

**Status:** Rascunho inicial — evolui junto com o projeto
**Referência de regras de negócio:** `docs/regras-de-negocio.md`

---

## 1. Stack Tecnológica

| Camada             | Tecnologia                  | Motivo da escolha                                                                                                                                                                                    |
| ------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend/Backend   | Next.js 16 (App Router)     | Full-stack em um único projeto, Server Actions eliminam a necessidade de uma API REST separada para a maior parte dos casos, e o roteamento por pastas facilita separar áreas pública/cliente/admin. |
| UI                 | React 19 + Tailwind CSS 4   | Produtividade e consistência visual sem CSS customizado espalhado.                                                                                                                                   |
| Linguagem          | TypeScript                  | Tipagem estática reduz erros em tempo de execução, essencial num domínio com regras de negócio sensíveis (estoque, pagamento).                                                                       |
| ORM                | Prisma 6                    | Migrations versionadas, type-safety end-to-end com o banco, suporte a transações atômicas (crítico para a regra de disponibilidade de cardápio).                                                     |
| Banco de dados     | PostgreSQL (Supabase)       | Relacional, suporta transações ACID — necessário para evitar overselling de pratos com quantidade limitada.                                                                                          |
| Autenticação       | NextAuth.js                 | Suporte a login social (Google) e controle de sessão/roles sem reinventar fluxo de auth.                                                                                                             |
| Pagamento          | Mercado Pago (Pix + Cartão) | Gateway com melhor suporte a Pix no mercado brasileiro, essencial para o público-alvo do sistema.                                                                                                    |
| Email transacional | Resend                      | Já usado em outros projetos do autor, API simples para confirmações e notificações.                                                                                                                  |
| Deploy             | Vercel (Hobby)              | Integração nativa com Next.js, deploy automático por branch/PR.                                                                                                                                      |

---

## 2. Por que Server Actions em vez de API REST tradicional

O projeto usa **Server Actions** do Next.js para a maioria das mutações (criar pedido, atualizar status, cadastrar cardápio), reservando **Route Handlers** (`/app/api/...`) apenas para:

- Webhook do Mercado Pago (`/api/webhooks/pagamento`) — precisa de uma URL pública HTTP tradicional, não pode ser Server Action.
- Endpoints que futuramente precisem ser consumidos por um cliente externo (ex: app mobile).

---

## 3. Estrutura de Pastas

```
/app
  /(public)                    # área pública, sem login obrigatório
    /cardapio                  # listagem do cardápio do dia
    /carrinho
    /checkout
  /(cliente)                   # área logada do cliente
    /pedidos                   # histórico e status
    /perfil                    # dados e endereços
  /(admin)                     # área logada do admin
    /cardapio                  # CRUD do cardápio diário
    /pedidos                   # painel kanban de status
    /configuracoes             # modo de entrega, horário de corte, zonas
    /relatorios
  /api
    /webhooks
      /pagamento               # Route Handler — recebe confirmação do Mercado Pago

/lib
  /services                    # regras de negócio puras (sem acesso direto a dados)
    verificarDisponibilidade.ts
    verificarHorarioCorte.ts
    calcularTaxaEntrega.ts
    processarConfirmacaoPagamento.ts
  /repositories                # única camada que fala com o Prisma
    pedidoRepository.ts
    cardapioRepository.ts
    configuracaoRepository.ts
  /auth                        # configuração do NextAuth
  /validations                 # schemas Zod de validação de input

/prisma
  schema.prisma
  /migrations

/docs
  regras-de-negocio.md
  arquitetura.md
  schema.md
```

**Regra de dependência:** componentes/Server Actions chamam `services`, `services` chamam `repositories`, `repositories` chamam Prisma. Nunca o inverso, e nunca uma Server Action acessando o Prisma diretamente — isso mantém a regra de negócio testável e desacoplada do banco.

---

## 4. Fluxo Crítico: Concorrência na Disponibilidade do Cardápio

Esse é o ponto mais delicado do sistema. Dois clientes podem tentar comprar a última marmita disponível ao mesmo tempo.

**Decisão:** a baixa de estoque **não** ocorre ao adicionar ao carrinho, e sim no momento em que o webhook do Mercado Pago confirma o pagamento. Entre a criação do pedido e a confirmação, não há reserva de estoque (assunção registrada no documento de regras — ponto em aberto).

Sequência:

1. Cliente finaliza checkout → Server Action cria `Pedido` com status `AGUARDANDO_PAGAMENTO` e gera cobrança no Mercado Pago.
2. Cliente paga (ou não) fora do sistema (app do banco, etc).
3. Mercado Pago chama `/api/webhooks/pagamento`.
4. Handler do webhook, dentro de uma **transação Prisma** (`$transaction`):
   a. Verifica se o `transaction_id` já foi processado (idempotência) — se sim, ignora.
   b. Reverifica se ainda há disponibilidade do prato.
   c. Se houver: incrementa `quantidade_vendida`, muda status do pedido para `CONFIRMADO`.
   d. Se não houver mais disponibilidade (concorrência): marca pedido como `CANCELADO` e sinaliza para reembolso/notificação ao cliente.
5. Dispara email via Resend.

**Expiração de pedido não pago:** pedidos em `AGUARDANDO_PAGAMENTO` por mais de 15 minutos são cancelados automaticamente por um job agendado (Vercel Cron ou similar), liberando a UI para o cliente tentar novamente.

---

## 5. Autenticação e Autorização

- NextAuth.js com provider Google + credentials (email/senha) como fallback.
- Roles armazenadas no `User.role` (`CLIENTE`, `ADMIN`).
- Middleware (`middleware.ts`) protege `/app/(admin)/*` exigindo `role = ADMIN`, e `/app/(cliente)/*` exigindo qualquer usuário autenticado.
- Área `/(public)` acessível sem login; login só é exigido no passo final do checkout.

---

## 6. Testes

| Tipo       | Ferramenta              | Foco                                                                                               |
| ---------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Unitário   | Vitest                  | Services: `verificarDisponibilidade`, `verificarHorarioCorte`, `calcularTaxaEntrega`               |
| Integração | Vitest + banco de teste | Repositories e transações críticas (concorrência de estoque)                                       |
| E2E        | Playwright              | Fluxo completo: cliente navega cardápio → checkout → (mock de pagamento) → aparece no painel admin |

---

## 7. CI/CD

- GitHub Actions (`.github/workflows/ci.yml`): a cada PR, roda `lint`, `type-check` e `test`.
- Deploy automático via integração nativa Vercel ↔ GitHub (preview em cada PR, produção na branch `main`).

---

## 8. Segurança

- Todas as variáveis sensíveis (`MERCADOPAGO_ACCESS_TOKEN`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`) via variáveis de ambiente, nunca commitadas — ver `.env.example`.
- Validação de assinatura do webhook do Mercado Pago antes de processar qualquer confirmação.
- Toda mutação revalida preço/disponibilidade no servidor, ignorando qualquer valor vindo do client.
- Rate limiting no endpoint de criação de pedido (a definir: Upstash Ratelimit ou solução simples em memória, já que é Hobby plan).

---

## 9. Pontos em Aberto

- [ ] Definir ferramenta de rate limiting compatível com Vercel Hobby (sem Redis dedicado)
- [ ] Definir mecanismo de cron job para expiração de pedidos (Vercel Cron tem limite de frequência no plano Hobby — validar)
- [ ] Decidir se login por credentials (email/senha) entra no MVP ou só Google
