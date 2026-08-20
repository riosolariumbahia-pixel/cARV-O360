-- Carvão360 — criar tabelas no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase.
-- Se você já criou as tabelas antes, rode apenas a seção ATUALIZAÇÃO no final.

create table if not exists public.fornos (
  id bigint primary key,
  nome text not null,
  tipo text default 'Alvenaria',
  cap numeric default 0,
  status text default 'Ativo',
  obs text default ''
);

create table if not exists public.producoes (
  id bigint primary key,
  forno_id bigint references public.fornos(id) on delete cascade,
  inicio date,
  fim date,
  madeira numeric default 0,
  qtd numeric default 0,
  status text default 'Em produção',
  obs text default ''
);

create table if not exists public.clientes (
  id bigint primary key,
  nome text not null,
  tel text default '',
  cidade text default '',
  estado text default '',
  forno_id bigint,
  prog text default 'Programado',
  prod_inicio date,
  prod_fim date,
  qtd numeric default 0,
  preco numeric default 0,
  data date,
  obs text default ''
);

alter table public.fornos enable row level security;
alter table public.producoes enable row level security;
alter table public.clientes enable row level security;

create policy "fornos_public" on public.fornos for all to anon, authenticated using (true) with check (true);
create policy "producoes_public" on public.producoes for all to anon, authenticated using (true) with check (true);
create policy "clientes_public" on public.clientes for all to anon, authenticated using (true) with check (true);

-- ===== ATUALIZAÇÃO (só se a tabela clientes já existia sem os campos novos) =====
alter table public.clientes add column if not exists estado text default '';
alter table public.clientes add column if not exists forno_id bigint;
alter table public.clientes add column if not exists prog text default 'Programado';
alter table public.clientes add column if not exists prod_inicio date;
alter table public.clientes add column if not exists prod_fim date;
