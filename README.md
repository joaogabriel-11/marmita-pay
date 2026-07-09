<div align="center">

# Marmita Pay

### Full Stack meal ordering platform with daily menu, stock control and Pix payments

<br/>

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

<br/>

<p align="center">
  <a href="https://marmita-pay.joaogabriels.com">
    <img src="https://img.shields.io/badge/Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white"/>
  </a>
  <a href="https://github.com/joaogabriel-11/marmita-pay">
    <img src="https://img.shields.io/badge/Code-181717?style=for-the-badge&logo=github&logoColor=white"/>
  </a>
</p>

<br/>

_A platform for restaurants to sell daily meals with stock control, Pix checkout and a real-time admin dashboard._

</div>

---

# About

**Marmita Pay** is a Full Stack application built with **Next.js App Router** to solve a real restaurant workflow: publish the daily menu, receive orders, reserve stock, generate Pix payments and manage operations through an admin dashboard.

The project was built with focus on:

- Clean Code
- Reusable Components
- Business rules centralized in services
- Repository layer for Prisma access
- Responsive UI for customers and administrators
- Secure payments through Mercado Pago
- Real-time updates with Supabase Realtime
- Simple maintenance and incremental evolution

---

# Features

## Public Area

- Daily menu
- Products with image, description, category and price
- Local cart
- Checkout with pickup or delivery
- ZIP code lookup with ViaCEP
- Delivery fee calculation by distance
- Pix copy and paste
- Pix QR Code
- Order status page
- Saved orders page in the browser
- Live order progress updates

---

## Checkout and Payment

- Server-side price revalidation
- Configurable minimum order value
- Stock reservation when Pix is generated
- Pending order expiration
- Mercado Pago integration
- Payment webhook
- Paid amount validation
- Automatic paid order confirmation
- Real-time admin notification

---

## Admin Dashboard

- Admin login
- Dashboard with order summary
- Order management
- Order status updates
- Cancellation with reason
- Real-time updates with Supabase Realtime
- Visual and sound notifications
- Create, edit and delete products
- Image upload with Vercel Blob
- Daily menu management
- Permanent menu items
- Restaurant settings
- Restaurant address with ZIP code and geolocation

---

## Business Rules

- Customers do not need an account
- Admin routes and Server Actions are protected
- Orders start as `AGUARDANDO_PAGAMENTO`
- Approved payment changes the order to `CONFIRMADO`
- Canceled pending orders change payment to `RECUSADO`
- Stock is reduced only after approved payment
- Pending orders expire on demand
- Delivery fee and total amount are frozen in the order
- Order status follows a valid state machine

---

# Tech Stack

| Technology | Description |
| --- | --- |
| Next.js 16 | Full stack framework with App Router |
| React 19 | UI Library |
| TypeScript | Static typing |
| Tailwind CSS 4 | Styling |
| Prisma 7 | ORM and database access |
| PostgreSQL | Relational database |
| Supabase | Database and Realtime |
| Mercado Pago | Pix payments and webhook |
| Vercel Blob | Image upload and storage |
| Zod | Validations |
| ESLint | Code quality |
| Vercel | Deployment |

---

# Project Structure

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

# Getting Started

Clone the repository

```bash
git clone https://github.com/joaogabriel-11/marmita-pay.git
```

Go to the project folder

```bash
cd marmita-pay
```

Install dependencies

```bash
npm install
```

Configure environment variables

```bash
cp .env.example .env.local
```

Generate Prisma Client

```bash
npx prisma generate
```

Run the project

```bash
npm run dev
```

Open

```text
http://localhost:3000
```

---

# Environment Variables

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

# Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server |
| `npm run build` | Generates Prisma Client and builds the app |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint |
| `npm run seed:demo` | Seeds demo data |

---

# Main Flows

## Pix Order

```text
Customer selects items
        |
Checkout revalidates data on the server
        |
System creates Order + pending Payment
        |
Mercado Pago generates Pix
        |
Customer pays
        |
Webhook confirms payment
        |
Order becomes CONFIRMADO
        |
Admin receives a real-time notification
```

---

## Stock Control

```text
available stock = quantidadeDisponivel - quantidadeVendida - active reservations
```

- `quantidadeDisponivel`: current stock set by the admin
- `quantidadeVendida`: incremented after approved payment
- active reservations: non-expired orders with `AGUARDANDO_PAGAMENTO` status

---

## Order Status

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

The admin dashboard uses **Supabase Realtime** to:

- receive new orders;
- update existing orders;
- update payment status;
- show created order notifications;
- show approved payment notifications.

Expected tables in the `supabase_realtime` publication:

```text
pedidos
pagamentos
notificacoes_admin
```

---

# Responsive Design

The project was designed to provide a good experience on:

- Desktop
- Laptop
- Tablet
- Mobile

The public area prioritizes quick mobile ordering. The admin area prioritizes scanning, operating and updating daily orders.

---

# Performance and Reliability

- Server Components whenever possible
- Server Actions for internal mutations
- Route Handlers for APIs and webhooks
- Sensitive data revalidation on the server
- Prisma transactions in critical flows
- Idempotent webhook processing
- On-demand pending order expiration
- Supabase Realtime with the official client
- Separation between UI, services and repositories

---

# Screenshots

Project screenshots will be added as the final screens stabilize.

| Public Area | Admin Dashboard |
| --- | --- |
| Coming soon | Coming soon |

---

# Roadmap

- More complete reports
- Dedicated kitchen dashboard
- Notification improvements
- Coupons and promotions
- Optional customer login and history
- Automatic or semi-automatic WhatsApp integration
- Card payments
- Automated tests for critical services

---

# Contributing

Contributions are welcome!

1. Fork the project

2. Create a new branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "feat: add new feature"
```

4. Push

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# Author

**Joao Gabriel dos Santos**

GitHub

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/joaogabriel-11)

LinkedIn

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/joaogabriel11)

---

<div align="center">

### If you liked this project, leave a star on the repository!

</div>
