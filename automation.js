// ============================================================================
// AUTOMAÇÃO E REGRAS DE NEGÓCIO
// ============================================================================

// Vincular cliente a ciclo de produção automaticamente
function autoVincularClienteProducao(clienteId) {
  const cliente = db.clientes.find(c => c.id === clienteId);
  if (!cliente || !cliente.fornoId) return;
  
  // Encontrar ciclo em produção ou próximo do forno vinculado
  const ciclo = db.producoes.find(p => 
    p.fornoId === cliente.fornoId && 
    p.status === 'Em produção'
  );
  
  if (ciclo) {
    cliente.prodInicio = ciclo.inicio;
    // Estimar término (ciclos típicos: 7-10 dias)
    const estimado = new Date(ciclo.inicio + 'T12:00');
    estimado.setDate(estimado.getDate() + 9);
    cliente.prodFim = estimado.toISOString().slice(0, 10);
    save();
    audit('auto_vincular', `Cliente ${cliente.nome} vinculado a ciclo ${ciclo.id}`, { clienteId, cicloId: ciclo.id });
  }
}

// Finalizar ciclo com validação
function finalizarCicloComValidacao(cicloId, quantidadeKg) {
  const ciclo = db.producoes.find(c => c.id === cicloId);
  if (!ciclo) return { ok: false, erro: 'Ciclo não encontrado' };
  
  if (ciclo.status !== 'Em produção') {
    return { ok: false, erro: 'Ciclo não está em produção' };
  }
  
  if (!quantidadeKg || quantidadeKg <= 0) {
    return { ok: false, erro: 'Quantidade deve ser maior que zero' };
  }
  
  ciclo.qtd = quantidadeKg;
  ciclo.status = 'Concluído';
  ciclo.fim = ciclo.fim || new Date().toISOString().slice(0, 10);
  
  // Calcular rendimento
  const rendimento = ciclo.madeira > 0 ? ciclo.qtd / ciclo.madeira : 0;
  
  // Validar rendimento (esperado 30-35 kg/m³)
  if (rendimento < 20) {
    criarNotificacao('ciclo_prox_finalizar', 'Rendimento Baixo', 
      `Ciclo ${ciclo.id} tem rendimento baixo: ${fmt(rendimento)} kg/m³`, 
      { cicloId, rendimento });
  }
  
  save();
  syncMgr.addCRUD('producoes', 'update', ciclo.id, prodRow(ciclo));
  audit('ciclo_finalizado', `Ciclo ${ciclo.id} finalizado com ${fmt(quantidadeKg)} kg`, { cicloId, qtd: quantidadeKg, rendimento });
  
  return { ok: true, ciclo, rendimento };
}

// Marcar entrega com validação
function marcarEntregaComValidacao(clienteId, quantidadeEntregue) {
  const cliente = db.clientes.find(c => c.id === clienteId);
  if (!cliente) return { ok: false, erro: 'Cliente não encontrado' };
  
  const solicitado = Number(cliente.qtd || 0);
  const entregue = Number(quantidadeEntregue || 0);
  
  if (entregue <= 0) {
    return { ok: false, erro: 'Quantidade deve ser maior que zero' };
  }
  
  if (entregue > solicitado * 1.1) { // Permitir 10% de margem
    criarNotificacao('ciclo_prox_finalizar', 'Entrega Acima do Esperado',
      `Cliente ${cliente.nome} recebeu ${fmt(entregue)} kg de ${fmt(solicitado)} kg solicitados`,
      { clienteId, solicitado, entregue });
  }
  
  cliente.qtd = entregue;
  cliente.prog = 'Entregue';
  cliente.data = cliente.data || new Date().toISOString().slice(0, 10);
  
  save();
  syncMgr.addCRUD('clientes', 'update', cliente.id, cliRow(cliente));
  audit('entrega_registrada', `Entrega a ${cliente.nome}: ${fmt(entregue)} kg`, { clienteId, qtd: entregue });
  
  return { ok: true, cliente };
}

// Alertas de manutenção preventiva
function verificarManutencaoPreventiva() {
  db.fornos.forEach(f => {
    const ciclos = db.producoes.filter(p => p.fornoId === f.id && p.status === 'Concluído');
    
    // Sugerir manutenção a cada 50 ciclos
    if (ciclos.length % 50 === 0 && ciclos.length > 0) {
      criarNotificacao('forno_manuencao', 'Manutenção Preventiva',
        `Forno ${f.nome} completou ${ciclos.length} ciclos. Sugere-se manutenção preventiva.`,
        { fornoId: f.id, ciclosCompletados: ciclos.length });
    }
  });
}
