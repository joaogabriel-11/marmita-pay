<div align="center">

# Marmita Pay

### Plataforma Full Stack para pedidos de refeições com cardápio diário, controle de estoque e pagamentos via Pix

<br/>

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge\&logo=nextdotjs)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge\&logo=tailwind-css\&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge\&logo=prisma\&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge\&logo=supabase\&logoColor=white)

<br/>

<p align="center">
  <a href="https://marmita-pay.joaogabriels.com"><img src="https://img.shields.io/badge/Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white"/></a>
  <a href="https://github.com/joaogabriel-11/marmita-pay"><img src="https://img.shields.io/badge/Code-181717?style=for-the-badge&logo=github&logoColor=white"/></a>
</p>

<br/>

<img width="1890" height="916" alt="marmita-pay-sem-endereco" src="https://github.com/user-attachments/assets/6a7d100e-83f0-4c3d-a327-cfebc14d663c" />

*Uma plataforma para restaurantes venderem refeições diárias com controle de estoque, checkout via Pix e painel administrativo em tempo real.*

</div>

---

# Sobre

O **Marmita Pay** é uma aplicação Full Stack desenvolvida com **Next.js App Router** para resolver um fluxo real de restaurante: publicar o cardápio do dia, receber pedidos, reservar estoque, gerar pagamentos via Pix e gerenciar as operações por meio de um painel administrativo.

O projeto foi desenvolvido com foco em:

* Código limpo
* Componentes reutilizáveis
* Regras de negócio centralizadas em serviços
* Camada de repositórios para acesso ao Prisma
* Interface responsiva para clientes e administradores
* Pagamentos seguros por meio do Mercado Pago
* Atualizações em tempo real com Supabase Realtime
* Manutenção simples e evolução incremental

---

# Funcionalidades

## Área Pública

* Cardápio diário
* Produtos com imagem, descrição, categoria e preço
* Carrinho local
* Checkout com retirada ou entrega
* Consulta de CEP com ViaCEP
* Cálculo da taxa de entrega por distância
* Pix Copia e Cola
* QR Code Pix
* Página de status do pedido
* Página de pedidos salvos no navegador
* Atualizações em tempo real do andamento do pedido

---

## Checkout e Pagamento

* Revalidação de preços no servidor
* Valor mínimo do pedido configurável
* Reserva de estoque quando o Pix é gerado
* Expiração de pedidos pendentes
* Integração com Mercado Pago
* Webhook de pagamento
* Validação do valor pago
* Confirmação automática de pedidos pagos
* Notificação em tempo real para o administrador

---

## Painel Administrativo

* Login do administrador
* Dashboard com resumo dos pedidos
* Gerenciamento de pedidos
* Atualização do status dos pedidos
* Cancelamento com motivo
* Atualizações em tempo real com Supabase Realtime
* Notificações visuais e sonoras
* Criação, edição e exclusão de produtos
* Upload de imagens com Vercel Blob
* Gerenciamento do cardápio diário
* Itens permanentes no cardápio
* Configurações do restaurante
* Endereço do restaurante com CEP e geolocalização

---

## Regras de Negócio

* Os clientes não precisam de uma conta
* As rotas administrativas e Server Actions são protegidas
* Os pedidos começam como `AGUARDANDO_PAGAMENTO`
* O pagamento aprovado altera o pedido para `CONFIRMADO`
* Pedidos pendentes cancelados alteram o pagamento para `RECUSADO`
* O estoque é reduzido somente após a aprovação do pagamento
* Pedidos pendentes expiram sob demanda
* A taxa de entrega e o valor total são congelados no pedido
* O status do pedido segue uma máquina de estados válida

---

# Tecnologias Utilizadas

| Tecnologia     | Descrição                           |
| -------------- | ----------------------------------- |
| Next.js 16     | Framework Full Stack com App Router |
| React 19       | Biblioteca de interfaces            |
| TypeScript     | Tipagem estática                    |
| Tailwind CSS 4 | Estilização                         |
| Prisma 7       | ORM e acesso ao banco de dados      |
| PostgreSQL     | Banco de dados relacional           |
| Supabase       | Banco de dados e Realtime           |
| Mercado Pago   | Pagamentos via Pix e webhook        |
| Vercel Blob    | Upload e armazenamento de imagens   |
| Zod            | Validações                          |
| ESLint         | Qualidade de código                 |
| Vercel         | Implantação                         |

---

# Estrutura do Projeto

```text
src
|
|-- app
|   |-- (public)
|   |   |-- cardapio
|   |   |-- carrinho
|   |   |-- checkout
|   |   |-- pedido/[codigo]
|   |   `-- pedidos
|   |
|   |-- admin
|   |   |-- cardapio
|   |   |-- configuracoes
|   |   |-- login
|   |   |-- pedidos
|   |   `-- pratos
|   |
|   `-- api
|       |-- cep
|       |-- entrega/distancia
|       |-- pedidos/[codigo]/status
|       `-- webhooks/mercado-pago
|
|-- components
|   |-- admin
|   |-- public
|   `-- ui
|
|-- lib
|   |-- auth
|   |-- core
|   |-- email
|   |-- mercado-pago
|   |-- repositories
|   |-- services
|   |-- supabase
|   |-- utils
|   `-- validations
|
`-- prisma.ts

prisma
|-- schema.prisma
|-- seed.ts
|-- seed-demo.ts
`-- sql

docs
|-- arquitetura.md
|-- regras-de-negocio.md
`-- schema.md
```

---

# Primeiros Passos

Clone o repositório

```bash
git clone https://github.com/joaogabriel-11/marmita-pay.git
```

Acesse a pasta do projeto

```bash
cd marmita-pay
```

Instale as dependências

```bash
npm install
```

Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Gere o Prisma Client

```bash
npx prisma generate
```

Execute o projeto

```bash
npm run dev
```

Abra

```text
http://localhost:3000
```

---

# Variáveis de Ambiente

```env
DATABASE_URL=""
DIRECT_URL=""

MERCADOPAGO_ACCESS_TOKEN=""
MERCADOPAGO_WEBHOOK_SECRET=""
MERCADOPAGO_USE_MOCK="false"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=""

APP_URL=""

ADMIN_EMAIL=""
ADMIN_PASSWORD=""
NEXTAUTH_SECRET=""

NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""

BLOB_READ_WRITE_TOKEN=""
BLOB_STORE_ID=""
BLOB_WEBHOOK_PUBLIC_KEY=""
VERCEL_OIDC_TOKEN=""
```

---

# Scripts Disponíveis

| Comando             | Descrição                                           |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Inicia o servidor de desenvolvimento                |
| `npm run build`     | Gera o Prisma Client e realiza o build da aplicação |
| `npm run start`     | Inicia o servidor de produção                       |
| `npm run lint`      | Executa o ESLint                                    |
| `npm run seed:demo` | Insere dados de demonstração                        |

---

# Principais Fluxos

## Pedido via Pix

```text
Cliente seleciona os itens
        |
Checkout revalida os dados no servidor
        |
Sistema cria o Pedido + Pagamento pendente
        |
Mercado Pago gera o Pix
        |
Cliente realiza o pagamento
        |
Webhook confirma o pagamento
        |
Pedido se torna CONFIRMADO
        |
Administrador recebe uma notificação em tempo real
```

---

## Controle de Estoque

```text
estoque disponível = quantidadeDisponivel - quantidadeVendida - reservas ativas
```

* `quantidadeDisponivel`: estoque atual definido pelo administrador
* `quantidadeVendida`: incrementada após a aprovação do pagamento
* reservas ativas: pedidos não expirados com status `AGUARDANDO_PAGAMENTO`

---

## Status do Pedido

```text
AGUARDANDO_PAGAMENTO
|-- EXPIRADO
|-- CANCELADO
`-- CONFIRMADO
    `-- EM_PREPARO
        |-- PRONTO_PARA_RETIRADA
        |   `-- RETIRADO
        `-- SAIU_PARA_ENTREGA
            `-- ENTREGUE
```

---

# Realtime

O painel administrativo utiliza o **Supabase Realtime** para:

* receber novos pedidos;
* atualizar pedidos existentes;
* atualizar o status dos pagamentos;
* exibir notificações de pedidos criados;
* exibir notificações de pagamentos aprovados.

Tabelas esperadas na publicação `supabase_realtime`:

```text
pedidos
pagamentos
notificacoes_admin
```

---

# Design Responsivo

O projeto foi desenvolvido para proporcionar uma boa experiência em:

* Desktop
* Notebook
* Tablet
* Celular

A área pública prioriza pedidos rápidos pelo celular. A área administrativa prioriza a visualização, o gerenciamento e a atualização dos pedidos diários.

---

# Desempenho e Confiabilidade

* Server Components sempre que possível
* Server Actions para alterações internas
* Route Handlers para APIs e webhooks
* Revalidação de dados sensíveis no servidor
* Transações Prisma em fluxos críticos
* Processamento idempotente de webhooks
* Expiração de pedidos pendentes sob demanda
* Supabase Realtime com o cliente oficial
* Separação entre interface, serviços e repositórios

---

# Capturas de Tela

As capturas de tela do projeto serão adicionadas conforme as telas finais forem estabilizadas.

| Área Pública | Painel Administrativo |
| ------------ | --------------------- |
| <img width="1919" height="919" alt="marmita-pay joaogabriels com_cardapio (1)" src="https://github.com/user-attachments/assets/082545e6-2ac3-4756-995a-9badacc6808a" /> | <img width="1919" height="919" alt="marmita-pay joaogabriels com_admin" src="https://github.com/user-attachments/assets/84ca9f19-ca80-46c0-895f-49d7535c7291" /> |

---

# Próximas Implementações

* Relatórios mais completos
* Painel dedicado para a cozinha
* Melhorias nas notificações
* Cupons e promoções
* Login e histórico opcionais para clientes
* Integração automática ou semiautomática com WhatsApp
* Pagamentos com cartão
* Testes automatizados para serviços críticos

---

# Contribuindo

Contribuições são bem-vindas!

1. Faça um fork do projeto

2. Crie uma nova branch

```bash
git checkout -b feature/new-feature
```

3. Faça o commit das suas alterações

```bash
git commit -m "feat: add new feature"
```

4. Envie as alterações

```bash
git push origin feature/new-feature
```

5. Abra um Pull Request

---

# Autor

**Joao Gabriel dos Santos**

GitHub

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge\&logo=github\&logoColor=white)](https://github.com/joaogabriel-11)

LinkedIn

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge\&logo=linkedin\&logoColor=white)](https://linkedin.com/in/joaogabriel11)

---

<div align="center">

### Se você gostou deste projeto, deixe uma estrela no repositório!

</div>
