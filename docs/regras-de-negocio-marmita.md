# Documento de Regras de Negócio
## Sistema de Cardápio e Pedidos — Marmitas

**Versão:** 1.0
**Status:** Rascunho para validação
**Última atualização:** definir na data de fechamento

---

## 1. Visão Geral

Sistema de pedidos de marmitas para um restaurante, com cardápio diário definido pelo administrador, controle de disponibilidade por quantidade produzida e pagamento online (Pix/Cartão).

**Premissa assumida:** o sistema atende **um único restaurante** (não é uma plataforma multi-restaurante tipo iFood). Se isso mudar, os itens 3 e 4 precisam ser revistos antes de modelar o banco.

---

## 2. Perfis de Usuário

| Perfil | Descrição | Acesso |
|---|---|---|
| **Cliente** | Faz pedidos, acompanha status, histórico | Área logada `/cliente` |
| **Admin** | Dono do restaurante — configura cardápio, entrega, vê relatórios | Área logada `/admin` |
| **Cozinha/Operação** (opcional, fase 2) | Atualiza status de preparo/entrega | Painel simplificado, só mudança de status |

- Cliente pode navegar o cardápio **sem login**, mas precisa se autenticar para finalizar o pedido (reduz fricção, mas garante rastreabilidade).
- Login social (Google) via NextAuth como opção principal.

---

## 3. Configurações do Restaurante

Entidade única de configuração (`ConfiguracaoRestaurante`), editável pelo admin, contendo:

| Campo | Descrição | Exemplo |
|---|---|---|
| `modo_entrega` | Enum: `DELIVERY`, `RETIRADA`, `AMBOS` | `AMBOS` |
| `horario_corte` | Horário limite (HH:mm) para pedidos do dia | `10:00` |
| `aceita_pedido_hoje` | Flag manual para o admin fechar pedidos do dia mesmo antes do corte (ex: acabou insumo) | `true/false` |
| `taxa_entrega_padrao` | Usada se não houver zona específica | `R$ 5,00` |
| `pedido_minimo` | Valor mínimo para checkout (opcional) | `R$ 15,00` |
| `whatsapp_contato` | Para exibir no rodapé/checkout | — |

**Regra central de corte:** pedidos para entrega/retirada **no mesmo dia** só são aceitos até `horario_corte`. Após esse horário, o cardápio do dia fica indisponível para novos pedidos — a tela deve comunicar isso claramente ("Pedidos encerrados por hoje, volte amanhã às 00:00" ou horário que o cardápio reabre).

- Não existe pedido para dias futuros nesta versão — o cardápio é sempre do dia corrente. (Assunção: confirmar se você quer permitir pedido antecipado para o dia seguinte, o que mudaria essa regra.)

---

## 4. Regras de Cardápio

- O admin cadastra o cardápio do dia com: prato, descrição, foto, preço, **quantidade disponível**.
- Cardápio pode ser duplicado do dia anterior (facilita o dia a dia).
- Um prato só aparece pro cliente se, simultaneamente:
  1. `quantidade_vendida < quantidade_disponivel`
  2. Horário atual `< horario_corte`
  3. `aceita_pedido_hoje = true`
- Quando um prato atinge quantidade disponível, ele deve sumir da lista automaticamente ou aparecer como "esgotado" (decisão de UX — recomendo mostrar "esgotado" em vez de sumir, gera confiança).
- **Concorrência:** a baixa de quantidade disponível deve ser feita dentro de uma transação atômica no banco (`Prisma $transaction`) no momento da **confirmação do pagamento**, não no momento em que o item entra no carrinho — evita reservar estoque de pedido que nunca foi pago.

---

## 5. Regras de Pedido

- Pedido é composto por um ou mais itens do cardápio do dia (não há itens de dias diferentes no mesmo pedido).
- Cliente escolhe, no checkout, se é **entrega** ou **retirada** — apenas se `modo_entrega = AMBOS`. Se o restaurante estiver configurado como só um dos dois, essa escolha não aparece.
- Se `DELIVERY` ou `AMBOS` com entrega escolhida: cliente informa endereço e o sistema calcula taxa pela zona de entrega cadastrada.
- Preço de cada item é **congelado no momento do pedido** (gravado no `ItemPedido`), não referenciado dinamicamente do cardápio — protege contra mudança de preço afetar pedidos já feitos.

### Status do pedido (máquina de estados)

```
AGUARDANDO_PAGAMENTO → CONFIRMADO → EM_PREPARO → SAIU_PARA_ENTREGA* → ENTREGUE
                     ↘ CANCELADO                                    ↘ (RETIRADO, se for retirada)
```
*`SAIU_PARA_ENTREGA` só existe se o pedido for do tipo entrega.

- Cancelamento pelo cliente só é permitido enquanto o status for `AGUARDANDO_PAGAMENTO` ou `CONFIRMADO` (antes de entrar em preparo). Depois disso, cancelamento só via admin.

---

## 6. Regras de Pagamento

- Métodos: **Pix** e **Cartão** via Mercado Pago (a confirmar).
- Pedido é criado no banco com status `AGUARDANDO_PAGAMENTO` antes de qualquer confirmação.
- Pix não confirma instantaneamente — confirmação chega via **webhook** assíncrono.
- Webhook deve ser **idempotente**: usar o ID da transação do gateway como chave única, para não processar a mesma confirmação duas vezes caso o Mercado Pago reenvie o evento.
- Só após confirmação do pagamento o sistema:
  1. Muda status para `CONFIRMADO`
  2. Decrementa a quantidade disponível do cardápio
  3. Dispara notificação ao cliente (Resend)
- Pedido não pago após um tempo limite (ex: 15 minutos) deve ser automaticamente cancelado e liberar a "reserva" (se houver alguma reserva temporária de estoque — a definir se o sistema vai reservar por X minutos ou não reservar nada até o pagamento).

---

## 7. Regras de Entrega e Retirada

- **Zonas de entrega:** cadastradas pelo admin, com taxa fixa por bairro/região (não cálculo por distância).
- **Retirada:** não há taxa; sistema informa horário estimado de disponibilidade para retirada.
- Tempo estimado de preparo/entrega deve ser exibido ao cliente no checkout (mesmo que seja uma estimativa fixa configurada pelo admin, ex: "entrega em até 40 min").

---

## 8. Regras de Notificação

| Evento | Canal |
|---|---|
| Pedido confirmado (pagamento aprovado) | Email (Resend) |
| Pedido saiu para entrega | Email (fase 2: WhatsApp) |
| Pedido cancelado | Email |

---

## 9. Regras de Segurança do Negócio

- Nunca confiar em preço, quantidade ou disponibilidade vindos do client — **sempre revalidar no servidor** no momento do checkout e novamente no momento da confirmação de pagamento.
- Rate limit no endpoint de criação de pedido (evita abuso/bot).
- Validação de assinatura/origem do webhook do Mercado Pago antes de aceitar qualquer confirmação de pagamento.

---

## 10. Fora de Escopo (MVP)

Itens conscientemente deixados de fora da primeira versão, para não inflar o escopo:

- Assinatura/plano semanal (confirmado: não entra por enquanto)
- Multi-restaurante
- Notificação via WhatsApp (fica pra fase 2)
- Programa de fidelidade/cupons

---

## 11. Pontos em Aberto (confirmar antes de modelar o banco)

- [ ] Confirmar gateway de pagamento: Mercado Pago é a escolha final?
- [ ] Confirmar se haverá reserva temporária de estoque durante o processo de pagamento, ou se a baixa só ocorre na confirmação (recomendado)
- [ ] Confirmar tempo limite para expirar pedido não pago (sugestão: 15 min)
- [ ] Confirmar se o cliente pode editar o pedido depois de criado (antes do pagamento) ou se precisa cancelar e recriar
