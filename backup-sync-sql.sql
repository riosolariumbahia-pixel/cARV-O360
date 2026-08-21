-- ============================================================================
-- ADIÇÕES AO BANCO SUPABASE PARA NOVAS FUNCIONALIDADES
-- ============================================================================

-- Tabela de Auditoria
create table if not exists public.audit_logs (
  id bigint primary key,
  timestamp timestamp default now(),
  user_id integer,
  user_nome text,
  tipo text,
  descricao text,
  dados jsonb
);

-- Tabela de Usuários e Sessões
create table if not exists public.usuarios (
  id bigint primary key,
  nome text not null,
  email text unique not null,
  senha text not null,
  role text default 'operador',
  ativo boolean default true,
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

-- Tabela de Notificações
create table if not exists public.notificacoes (
  id bigint primary key,
  timestamp timestamp default now(),
  tipo text,
  titulo text,
  descricao text,
  dados jsonb,
  lido boolean default false
);

-- Tabela de Fila de Sincronização
create table if not exists public.sync_queue (
  id bigint primary key,
  timestamp timestamp default now(),
  tabela text,
  operacao text,
  dados jsonb,
  status text default 'pendente'
);

-- Políticas de segurança
alter table public.audit_logs enable row level security;
alter table public.usuarios enable row level security;
alter table public.notificacoes enable row level security;
alter table public.sync_queue enable row level security;

create policy "audit_public" on public.audit_logs for all to anon, authenticated using (true) with check (true);
create policy "usuarios_public" on public.usuarios for all to anon, authenticated using (true) with check (true);
create policy "notificacoes_public" on public.notificacoes for all to anon, authenticated using (true) with check (true);
create policy "sync_queue_public" on public.sync_queue for all to anon, authenticated using (true) with check (true);

-- Índices para performance
create index if not exists idx_audit_timestamp on public.audit_logs(timestamp);
create index if not exists idx_audit_user on public.audit_logs(user_id);
create index if not exists idx_notificacoes_lido on public.notificacoes(lido);
create index if not exists idx_sync_status on public.sync_queue(status);
