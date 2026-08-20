-- Carvão360 — criar tabelas no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

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
  qtd numeric default 0,
  preco numeric default 0,
  data date,
  status text default 'Agendado',
  obs text default ''
);

-- RLS + permissões para a chave publicável (papel anon)
alter table public.fornos enable row level security;
alter table public.producoes enable row level security;
alter table public.clientes enable row level security;

create policy "fornos_public" on public.fornos for all to anon, authenticated using (true) with check (true);
create policy "producoes_public" on public.producoes for all to anon, authenticated using (true) with check (true);
create policy "clientes_public" on public.clientes for all to anon, authenticated using (true) with check (true);
