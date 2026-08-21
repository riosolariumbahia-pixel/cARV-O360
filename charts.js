// ============================================================================
// GRÁFICOS E VISUALIZAÇÕES (Chart.js)
// ============================================================================

const CHART_COLORS = {
  accent: '#f59e0b',
  accent2: '#10b981',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#a78bfa',
  bg: 'rgba(15, 20, 25, 0.8)'
};

let charts = {}; // Cache de instâncias Chart

function renderChart(id, type, data, options = {}) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  
  // Destruir gráfico anterior
  if (charts[id]) {
    charts[id].destroy();
  }
  
  charts[id] = new Chart(ctx, {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#e6edf3', font: { size: 12 } }
        }
      },
      scales: {
        x: { ticks: { color: '#8b98a5' }, grid: { color: 'rgba(38, 51, 64, 0.3)' } },
        y: { ticks: { color: '#8b98a5' }, grid: { color: 'rgba(38, 51, 64, 0.3)' } }
      },
      ...options
    }
  });
}

function chartProducaoMensal() {
  const hoje = new Date();
  const meses = [];
  const dados = [];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push(MES[d.getMonth()].slice(0, 3));
    
    const prods = db.producoes.filter(p => {
      if (!p.fim || p.status !== 'Concluído') return false;
      const fdata = new Date(p.fim + 'T12:00');
      return fdata.getMonth() === d.getMonth() && fdata.getFullYear() === d.getFullYear();
    });
    
    dados.push(prods.reduce((s, p) => s + Number(p.qtd || 0), 0));
  }
  
  renderChart('chartProducaoMensal', 'line', {
    labels: meses,
    datasets: [{
      label: 'Carvão Produzido (kg)',
      data: dados,
      borderColor: CHART_COLORS.accent,
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      tension: 0.4,
      fill: true
    }]
  });
}

function chartProducaoPorForno() {
  const fornos = db.fornos.filter(f => db.producoes.some(p => p.fornoId === f.id && p.status === 'Concluído'));
  const dados = fornos.map(f => {
    return db.producoes
      .filter(p => p.fornoId === f.id && p.status === 'Concluído')
      .reduce((s, p) => s + Number(p.qtd || 0), 0);
  });
  
  renderChart('chartProducaoPorForno', 'bar', {
    labels: fornos.map(f => f.nome),
    datasets: [{
      label: 'Total Produzido (kg)',
      data: dados,
      backgroundColor: [
        CHART_COLORS.accent,
        CHART_COLORS.accent2,
        CHART_COLORS.blue,
        CHART_COLORS.purple,
        CHART_COLORS.red
      ]
    }]
  });
}

function chartVendasMensais() {
  const hoje = new Date();
  const meses = [];
  const vendas = [];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push(MES[d.getMonth()].slice(0, 3));
    
    const clientes = db.clientes.filter(c => {
      if (!c.data || !cliEntregue(c)) return false;
      const dcliente = new Date(c.data + 'T12:00');
      return dcliente.getMonth() === d.getMonth() && dcliente.getFullYear() === d.getFullYear();
    });
    
    vendas.push(clientes.reduce((s, c) => s + Number(c.qtd || 0) * Number(c.preco || 0), 0));
  }
  
  renderChart('chartVendasMensais', 'line', {
    labels: meses,
    datasets: [{
      label: 'Vendas (R$)',
      data: vendas,
      borderColor: CHART_COLORS.accent2,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true
    }]
  });
}

function chartRendimento() {
  const fornos = db.fornos;
  const dados = fornos.map(f => {
    const prods = db.producoes.filter(p => p.fornoId === f.id && p.status === 'Concluído' && Number(p.madeira) > 0);
    if (!prods.length) return 0;
    return prods.reduce((s, p) => s + (Number(p.qtd) / Number(p.madeira)), 0) / prods.length;
  });
  
  renderChart('chartRendimento', 'radar', {
    labels: fornos.map(f => f.nome),
    datasets: [{
      label: 'Rendimento (kg/m³)',
      data: dados,
      borderColor: CHART_COLORS.blue,
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }]
  });
}

function chartDemandaVsEstoque() {
  const estoque = estoqueAtual();
  const demanda = db.clientes.filter(c => !cliEntregue(c)).reduce((s, c) => s + Number(c.qtd || 0), 0);
  
  renderChart('chartDemandaVsEstoque', 'doughnut', {
    labels: ['Estoque Disponível', 'Demanda Pendente'],
    datasets: [{
      data: [estoque, demanda],
      backgroundColor: [CHART_COLORS.accent2, CHART_COLORS.red]
    }]
  });
}
