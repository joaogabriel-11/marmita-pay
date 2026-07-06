# Documento de Regras de Negócio
## Sistema de Cardápio e Pedidos — Marmitas

**Versão:** 1.1  
**Status:** Rascunho validado para início do MVP  
**Última atualização:** 06/07/2026

---

## 1. Visão Geral

Sistema de pedidos de marmitas para um restaurante, com cardápio diário definido pelo administrador, controle de disponibilidade por quantidade produzida e pagamento online via Pix.

**Premissa assumida:** o sistema atende **um único restaurante** no MVP. Não é uma plataforma multi-restaurante tipo iFood. Se isso mudar futuramente, as entidades principais precisarão receber vínculo com restaurante, como `restaurantId`.

---

## 2. Perfis de Usuário

| Perfil | Descrição | Acesso |
|---|---|---|
| **Cliente** | Faz pedidos informando nome, telefone e endereço, sem criar conta | Sem área logada no MVP |
| **Admin** | Dono do restaurante — configura cardápio, entrega, pedidos e relatórios | Área logada `/admin` |
| **Cozinha/Operação** | Atualiza status de preparo/entrega | Fase 2 — painel simplificado |

### Decisão do MVP

Cliente **não cria conta nem faz login** no MVP. No checkout, informa apenas:

- nome;
- telefone/WhatsApp;
- email opcional;
- endereço, se for entrega.

Essa decisão reduz fricção. O público de marmitaria normalmente quer comprar rápido pelo celular, e login de cliente não resolve o problema central do restaurante: controlar produção, receber pagamento antes do preparo e evitar desperdício.

- Login com NextAuth fica restrito ao **Admin** no MVP.
- Histórico de pedidos e área `/cliente` ficam para fase 2.

---

## 3. Configurações do Restaurante

Entidade única de configuração (`ConfiguracaoRestaurante`), editável pelo admin.

| Campo | Descrição | Exemplo |
|---|---|---|
| `modo_entrega` | Enum: `DELIVERY`, `RETIRADA`, `AMBOS` | `AMBOS` |
| `horario_corte` | Horário limite para pedidos do dia | `10:00` |
| `pedidos_ativos` | Flag manual para abrir/fechar pedidos do dia | `true` |
| `motivo_fechamento` | Texto opcional exibido quando a loja estiver fechada | `Sem produção hoje` |
| `taxa_entrega_padrao` | Taxa usada se não houver zona específica | `R$ 5,00` |
| `pedido_minimo` | Valor mínimo para checkout | `R$ 15,00` |
| `tempo_preparo_minutos` | Estimativa para retirada | `30` |
| `tempo_entrega_minutos` | Estimativa para entrega | `40` |
| `whatsapp_contato` | WhatsApp exibido no rodapé/checkout | `5514999999999` |

### Regra central de corte

Pedidos para entrega ou retirada **no mesmo dia** só são aceitos até `horario_corte`.

Após esse horário, o cardápio do dia fica indisponível para novos pedidos. A tela deve comunicar isso claramente, por exemplo:

> Pedidos encerrados por hoje. Volte amanhã para conferir o novo cardápio.

### Timezone

Todo horário de regra de negócio (`horario_corte`, expiração de pedido etc.) é interpretado em `America/Sao_Paulo`.

Datas e timestamps são armazenados em UTC no banco. A conversão para o fuso local acontece na camada de `services`, nunca diretamente espalhada em componentes ou queries.

### Pedido futuro

Não existe pedido para dias futuros nesta versão. O cardápio é sempre do dia corrente.

---

## 4. Regras de Cardápio

- O admin cadastra os pratos base no catálogo.
- O admin monta o cardápio do dia escolhendo pratos, preço do dia e quantidade disponível.
- O cardápio pode ser duplicado do dia anterior para facilitar a rotina.
- Um prato pode aparecer como destaque.
- Um prato pode ser ocultado/desativado no cardápio do dia sem apagar histórico.

Um prato só pode ser comprado se, simultaneamente:

1. `pedidos_ativos = true`;
2. horário atual `< horario_corte`;
3. `CardapioDia.ativo = true`;
4. disponibilidade real for maior que zero.

### Disponibilidade real

A disponibilidade real é calculada assim:

```txt
quantidadeDisponivel - quantidadeVendida - quantidadeReservada
```

Onde:

```txt
quantidadeDisponivel = total produzido para o dia
quantidadeVendida    = soma dos pedidos confirmados/pagos
quantidadeReservada  = soma dos pedidos aguardando pagamento e ainda não expirados
```

Quando um prato atinge o limite, a recomendação de UX é exibir como **Esgotado**, em vez de simplesmente remover da lista. Isso gera mais confiança no cliente.

### Concorrência

A disponibilidade deve ser revalidada dentro de uma transação atômica no momento da criação do pedido e geração do Pix.

Nesse momento, o sistema reserva o estoque por 15 minutos. Se o pagamento for confirmado, a reserva vira venda. Se o pedido expirar, a reserva é liberada automaticamente.

Se o pedido tiver vários itens, todos os itens precisam ter disponibilidade suficiente. Se qualquer item não tiver estoque, o pedido inteiro não deve ser criado.

---

## 5. Regras de Pedido

- Pedido é composto por um ou mais itens do cardápio do dia.
- Não há itens de dias diferentes no mesmo pedido.
- Cliente escolhe se é **entrega** ou **retirada** apenas se `modo_entrega = AMBOS`.
- Se o restaurante estiver configurado apenas como `DELIVERY` ou apenas como `RETIRADA`, essa escolha não aparece.
- Se o pedido for entrega, o cliente informa endereço e o sistema calcula taxa pela zona de entrega cadastrada.
- Se nenhuma zona específica for encontrada/aplicável, o sistema pode usar `taxa_entrega_padrao`, se configurada.
- Preço de cada item é congelado no momento do pedido em `ItemPedido.precoUnitario`.
- Taxa de entrega e valor total também são congelados no momento do pedido.

### Edição de pedido

Depois que o pedido foi criado e o Pix foi gerado, o cliente não pode editar o pedido.

Antes de gerar o Pix, o cliente edita o carrinho livremente. Após gerar o Pix, deve cancelar o pedido, aguardar expirar ou criar outro pedido.

Essa decisão evita inconsistência entre:

- valor do Pix;
- itens reservados;
- estoque reservado;
- valor total;
- pagamento já iniciado.

### Código do pedido

Além do `id` interno, o pedido deve possuir um código amigável, como:

```txt
Pedido #1024
```

Esse código será usado no painel admin, emails e tela de confirmação.

---

## 6. Status do Pedido

Máquina de estados:

```txt
AGUARDANDO_PAGAMENTO
  ├── EXPIRADO                 (não pago dentro do prazo — ação automática)
  ├── CANCELADO                (ação humana — cliente ou admin)
  └── CONFIRMADO
        ├── EM_PREPARO
        │     ├── PRONTO_PARA_RETIRADA   (se tipoEntrega = RETIRADA)
        │     │     └── RETIRADO
        │     └── SAIU_PARA_ENTREGA      (se tipoEntrega = DELIVERY)
        │           └── ENTREGUE
```

### Diferença entre `EXPIRADO` e `CANCELADO`

- `EXPIRADO`: automático, quando o pedido vence sem pagamento.
- `CANCELADO`: ação humana, feita pelo cliente ou admin.

Essa separação é importante para relatórios. Misturar os dois esconde se o problema é desistência, fricção no pagamento ou cancelamento operacional.

### Cancelamento

Cancelamento pelo cliente só é permitido enquanto o pedido estiver em:

- `AGUARDANDO_PAGAMENTO`; ou
- `CONFIRMADO`, antes de entrar em preparo.

Depois que o pedido entra em `EM_PREPARO`, cancelamento só via admin.

Pedidos cancelados devem registrar:

- data/hora do cancelamento;
- motivo do cancelamento, se informado.

---

## 7. Regras de Pagamento

### Método do MVP

O MVP usa apenas **Pix via Mercado Pago**.

Pagamento via cartão fica para fase 2, para não inflar o escopo. Pix já resolve a maior parte do problema real da marmitaria: evitar preparo de pedido sem pagamento.

### Fluxo de pagamento

1. Cliente finaliza checkout.
2. Sistema revalida preço, horário de corte, pedido mínimo, entrega e disponibilidade.
3. Sistema cria pedido com status `AGUARDANDO_PAGAMENTO`.
4. Sistema reserva o estoque por 15 minutos.
5. Sistema cria cobrança Pix no Mercado Pago.
6. Cliente paga pelo app do banco.
7. Mercado Pago envia webhook.
8. Sistema valida o webhook.
9. Sistema consulta a API do Mercado Pago para confirmar dados reais do pagamento.
10. Sistema atualiza pagamento para `APROVADO` e pedido para `CONFIRMADO`.
11. Sistema dispara notificação ao cliente.

### Reserva de estoque

A reserva acontece no momento em que o Pix é gerado.

```txt
quantidadeReservada = soma dos itens em pedidos AGUARDANDO_PAGAMENTO com expiraEm > now
```

Pedido em `AGUARDANDO_PAGAMENTO` por mais de 15 minutos muda automaticamente para `EXPIRADO`, liberando a reserva.

Pedidos `EXPIRADO` ou `CANCELADO` não contam como reserva.

### Webhook

O webhook deve ser idempotente.

Regras:

- usar `gatewayPaymentId` como chave única;
- validar assinatura/origem da requisição;
- não confiar apenas no payload recebido;
- consultar o endpoint do pagamento na API do Mercado Pago;
- confirmar se o pagamento pertence ao pedido esperado via `externalReference`;
- confirmar se o valor pago corresponde ao valor esperado;
- processar o mesmo evento apenas uma vez.

---

## 8. Regras de Entrega e Retirada

### Zonas de entrega

O admin cadastra zonas de entrega com taxa fixa por bairro/região.

Exemplos:

```txt
Centro      → R$ 5,00
Zona Norte  → R$ 8,00
Zona Sul    → R$ 10,00
```

Não haverá cálculo por distância no MVP.

### Retirada

Retirada não possui taxa.

O sistema deve exibir uma estimativa baseada em `tempo_preparo_minutos`, por exemplo:

> Retirada disponível em aproximadamente 30 minutos após confirmação do pagamento.

### Entrega

O sistema deve exibir uma estimativa baseada em `tempo_entrega_minutos`, por exemplo:

> Entrega em até 40 minutos após confirmação do pagamento.

---

## 9. Regras de Notificação

| Evento | Canal | MVP |
|---|---|---|
| Pedido confirmado | Email via Resend | Sim, se cliente informar email |
| Pedido cancelado | Email via Resend | Sim, se cliente informar email |
| Pedido saiu para entrega | Email via Resend | Opcional |
| WhatsApp automático/semi-automático | WhatsApp | Fase 2 |

Como o email é opcional no checkout, a ausência de email não bloqueia o pedido.

---

## 10. Regras de Segurança do Negócio

- Nunca confiar em preço, quantidade, disponibilidade, taxa ou total vindos do client.
- Sempre revalidar no servidor no momento do checkout.
- Sempre revalidar pagamento no webhook consultando a API do gateway.
- Rate limit no endpoint/server action de criação de pedido.
- Validação de assinatura/origem do webhook do Mercado Pago.
- Autorização de admin deve ser validada dentro das Server Actions, não apenas via middleware.
- Variáveis sensíveis nunca devem ser commitadas.

---

## 11. Fora de Escopo do MVP

Itens conscientemente deixados de fora da primeira versão:

- multi-restaurante;
- assinatura/plano semanal;
- login/conta de cliente;
- histórico de pedidos do cliente;
- pagamento via cartão;
- WhatsApp automático;
- programa de fidelidade;
- cupons;
- painel separado de cozinha/operação;
- testes E2E obrigatórios antes do MVP.

---

## 12. Decisões Resolvidas

- Gateway de pagamento: Mercado Pago.
- Método de pagamento do MVP: Pix.
- Reserva de estoque: sim, por 15 minutos.
- Expiração do pedido: 15 minutos.
- Login de cliente: não existe no MVP.
- Cliente pode editar pedido após Pix gerado: não.
- Categoria: tabela própria, com seed inicial e edição pelo admin.

---

## 13. Pontos em Aberto

- [ ] Confirmar se o admin usará apenas login Google ou também email/senha.
- [ ] Confirmar frequência do cron de expiração conforme plano da Vercel.
- [ ] Confirmar solução de rate limit compatível com Vercel Hobby.
