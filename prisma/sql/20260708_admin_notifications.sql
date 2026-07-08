create table if not exists "notificacoes_admin" (
  "id" text primary key,
  "tipo" text not null,
  "titulo" text not null,
  "mensagem" text not null,
  "pedidoId" text,
  "codigoPedido" integer,
  "lida" boolean not null default false,
  "createdAt" timestamp(3) not null default current_timestamp
);

create index if not exists "notificacoes_admin_tipo_idx"
  on "notificacoes_admin" ("tipo");

create index if not exists "notificacoes_admin_createdAt_idx"
  on "notificacoes_admin" ("createdAt");

do $$
begin
  alter publication supabase_realtime add table "notificacoes_admin";
exception
  when duplicate_object then null;
end $$;
