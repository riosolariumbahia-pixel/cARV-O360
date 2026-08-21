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

-- ===== BRIQUETE360 — módulos ERP =====
create table if not exists public.fornecedores (
  id bigint primary key, nome text not null, tipo text default 'Serraria',
  tel text default '', cidade text default '', estado text default '',
  produto text default '', preco numeric default 0, ultimo date, status text default 'Ativo'
);
create table if not exists public.pedidos (
  id bigint primary key, cliente text not null, produto text default '',
  qtd numeric default 0, valor numeric default 0, desconto numeric default 0, frete numeric default 0,
  entrega date, vendedor text default '', status text default 'Orçamento'
);
create table if not exists public.estoque (
  id bigint primary key, item text not null, cat text default 'Matéria-prima',
  qtd numeric default 0, un text default 'kg', min numeric default 0, local text default ''
);
create table if not exists public.financeiro (
  id bigint primary key, descricao text not null, tipo text default 'Receber',
  categoria text default 'Outro', forma text default 'PIX',
  valor numeric default 0, venc date, status text default 'Previsto'
);
create table if not exists public.entregas (
  id bigint primary key, cliente text not null, motorista text default '',
  veiculo text default '', rota text default '', frete numeric default 0,
  data date, status text default 'Agendada'
);
create table if not exists public.funil (
  id bigint primary key, lead text not null, estagio text default 'Lead',
  valor numeric default 0, vendedor text default '', previsao date
);

alter table public.fornecedores enable row level security;
alter table public.pedidos enable row level security;
alter table public.estoque enable row level security;
alter table public.financeiro enable row level security;
alter table public.entregas enable row level security;
alter table public.funil enable row level security;

create policy "fornecedores_public" on public.fornecedores for all to anon, authenticated using (true) with check (true);
create policy "pedidos_public" on public.pedidos for all to anon, authenticated using (true) with check (true);
create policy "estoque_public" on public.estoque for all to anon, authenticated using (true) with check (true);
create policy "financeiro_public" on public.financeiro for all to anon, authenticated using (true) with check (true);
create policy "entregas_public" on public.entregas for all to anon, authenticated using (true) with check (true);
create policy "funil_public" on public.funil for all to anon, authenticated using (true) with check (true);
