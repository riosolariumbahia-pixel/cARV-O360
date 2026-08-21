// ============================================================================
// AUDITORIA E HISTÓRICO
// ============================================================================

const AUDIT_LS = 'carvao360_audit';

function audit(tipo, descricao, dados = {}) {
  if (!currentUser) return;
  
  const auditLog = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    userId: currentUser.userId,
    userNome: currentUser.nome,
    tipo,
    descricao,
    dados,
    ip: 'local' // Em produção, obter IP real
  };
  
  let logs = JSON.parse(localStorage.getItem(AUDIT_LS) || '[]');
  logs.push(auditLog);
  
  // Manter últimos 10.000 registros
  if (logs.length > 10000) {
    logs = logs.slice(-10000);
  }
  
  localStorage.setItem(AUDIT_LS, JSON.stringify(logs));
  
  // Enviar para Supabase em background
  if (supaOnline) {
    api('audit_logs', { method: 'POST', body: JSON.stringify(auditLog) }).catch(() => {});
  }
}

function getAuditLog(filtros = {}) {
  if (!hasPermission('audit')) return [];
  
  let logs = JSON.parse(localStorage.getItem(AUDIT_LS) || '[]');
  
  if (filtros.tipo) {
    logs = logs.filter(l => l.tipo === filtros.tipo);
  }
  if (filtros.userId) {
    logs = logs.filter(l => l.userId === filtros.userId);
  }
  if (filtros.dataInicio) {
    logs = logs.filter(l => new Date(l.timestamp) >= new Date(filtros.dataInicio));
  }
  if (filtros.dataFim) {
    logs = logs.filter(l => new Date(l.timestamp) <= new Date(filtros.dataFim));
  }
  
  return logs.sort((a, b) => b.id - a.id);
}

function exportAuditLog(filtros = {}) {
  const logs = getAuditLog(filtros);
  const csv = [
    ['ID', 'Data/Hora', 'Usuário', 'Tipo', 'Descrição', 'Dados'].join(','),
    ...logs.map(l => [
      l.id,
      l.timestamp,
      l.userNome,
      l.tipo,
      l.descricao,
      JSON.stringify(l.dados).replace(/,/g, ';')
    ].map(v => `"${v}"`).join(','))
  ].join('\n');
  
  downloadFile(csv, `auditoria_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
}
