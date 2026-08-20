# Carvão360 — Gestão de Produção de Carvão

Sistema de gestão de fornos de carvão vegetal: controle de cada forno, ciclos de queima (início/término/quantidade produzida), clientes agendados para compra e relatório mensal de produção.

## Como usar

1. Crie as tabelas no Supabase executando `setup-supabase.sql` no SQL Editor do seu projeto.
2. Abra o `index.html` (ou a URL publicada) — o app conecta ao Supabase automaticamente.

## Funcionalidades

- 🔥 Cadastro ilimitado de fornos (nome livre, tipo, capacidade, status)
- ⚙️ Ciclos de produção com data de início/término, madeira (m³) e carvão produzido (kg), rendimento kg/m³
- 👥 Clientes agendados com quantidade, preço/kg e data prevista de fornecimento
- 📊 Dashboard com estoque, demanda, receita e status de cada forno
- 📄 Relatório mensal por forno com impressão/PDF
- ☁️ Sincronização com Supabase (REST API) com fallback local

## Deploy na Vercel

Projeto 100% estático: importe o repositório na Vercel sem nenhuma configuração adicional.
