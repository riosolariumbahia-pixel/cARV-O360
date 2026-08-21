// ============================================================================
// NOTIFICAÇÕES E ALERTAS
// ============================================================================

const NOTIFICATIONS_LS = 'carvao360_notifications';

const ALERT_TYPES = {
  ciclo_atrasado: { cor: 'red', icone: '⏰', titulo: 'Ciclo Atrasado' },
  ciclo_prox_finalizar: { cor: 'orange', icone: '⚠️', titulo: 'Ciclo Próximo de Finalizar' },
  estoque_baixo: { cor: 'red', icone: '📉', titulo: 'Estoque Baixo' },
  entrega_atrasada: { cor: 'red', icone: '🚚', titulo: 'Entrega Atrasada' },
  cliente_agendado: { cor: 'blue', icone: '📅', titulo: 'Cliente Agendado' },
  forno_manuencao: { cor: 'yellow', icone: '🔧', titulo: 'Forno em Manutenção' }
};

function criarNotificacao(tipo, titulo, descricao, dados = {}) {
  const notif = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    tipo,
    titulo,
    descricao,
    dados,
    lido: false
  };
  
  let notifs = JSON.parse(localStorage.getItem(NOTIFICATIONS_LS) || '[]');
  notifs.push(notif);
  
  // Manter últimos 500 registros
  if (notifs.length > 500) {
    notifs = notifs.slice(-500);
  }
  
  localStorage.setItem(NOTIFICATIONS_LS, JSON.stringify(notifs));
  return notif;
}

function getNotificacoes(naoLidas = false) {
  let notifs = JSON.parse(localStorage.getItem(NOTIFICATIONS_LS) || '[]');
  if (naoLidas) {
    notifs = notifs.filter(n => !n.lido);
  }
  return notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function marcarComoLida(notifId) {
  let notifs = JSON.parse(localStorage.getItem(NOTIFICATIONS_LS) || '[]');
  const notif = notifs.find(n => n.id === notifId);
  if (notif) {
    notif.lido = true;
    localStorage.setItem(NOTIFICATIONS_LS, JSON.stringify(notifs));
  }
}

function marcarTodasComoLidas() {
  let notifs = JSON.parse(localStorage.getItem(NOTIFICATIONS_LS) || '[]');
  notifs.forEach(n => n.lido = true);
  localStorage.setItem(NOTIFICATIONS_LS, JSON.stringify(notifs));
}

// Verificar alertas periodicamente
function verificarAlertas() {
  if (!currentUser) return;
  
  const hoje = new Date();
  
  // Verificar ciclos atrasados (> 14 dias)
  db.producoes.filter(p => p.status === 'Em produção' && p.inicio).forEach(p => {
    const dias = Math.floor((Date.now() - new Date(p.inicio + 'T12:00')) / 864e5);
    if (dias > 14) {
      const forno = db.fornos.find(f => f.id === p.fornoId);
      criarNotificacao(
        'ciclo_atrasado',
        'Ciclo Atrasado',
        `Forno ${forno?.nome} em produção há ${dias} dias`,
        { fornoId: p.fornoId, producaoId: p.id, dias }
      );
    }
  });
  
  // Verificar entregas atrasadas
  db.clientes.filter(c => c.data && c.prog !== 'Entregue').forEach(c => {
    const dataPrev = new Date(c.data);
    if (dataPrev < hoje) {
      criarNotificacao(
        'entrega_atrasada',
        'Entrega Atrasada',
        `Cliente ${c.nome} com entrega vencida em ${fmtDate(c.data)}`,
        { clienteId: c.id }
      );
    }
  });
  
  // Verificar estoque baixo
  const estoque = estoqueAtual();
  const demanda = db.clientes.filter(c => !cliEntregue(c)).reduce((s, c) => s + Number(c.qtd || 0), 0);
  if (estoque < demanda * 0.2) { // Alerta se < 20% da demanda
    criarNotificacao(
      'estoque_baixo',
      'Estoque Baixo',
      `Estoque (${fmt(estoque)} kg) abaixo de 20% da demanda (${fmt(demanda)} kg)`,
      { estoque, demanda }
    );
  }
}

// Executar verificação a cada 30 minutos
setInterval(verificarAlertas, 30 * 60 * 1000);
verificarAlertas(); // Executar na inicialização
