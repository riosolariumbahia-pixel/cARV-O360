// ============================================================================
// EXPORTAÇÃO DE DADOS (Excel, PDF, CSV)
// ============================================================================

// Baixar arquivo
function downloadFile(content, filename, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  audit('export', `Arquivo exportado: ${filename}`, { filename, type });
}

// Exportar para CSV
function exportCSV(data, filename = 'export.csv', headers = []) {
  let csv = headers.length ? headers.join(',') + '\n' : '';
  csv += data.map(row => 
    Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  downloadFile(csv, filename, 'text/csv');
}

// Exportar relatório de produção em Excel (usando SheetJS ou tabletop)
function exportRelatorioExcel() {
  if (!hasPermission('export')) {
    toast('Sem permissão para exportar');
    return;
  }
  
  const { ini, fim, label } = periodRange();
  const noPeriodo = s => s && new Date(s + 'T12:00') >= ini && new Date(s + 'T12:00') <= fim;
  const ciclos = db.producoes.filter(p => p.status === 'Concluído' && noPeriodo(p.fim));
  const vendas = db.clientes.filter(c => cliEntregue(c) && noPeriodo(c.data));
  
  // Usar CSV como fallback (ideal usar SheetJS em produção)
  let xlsx = 'RELATÓRIO DE PRODUÇÃO - ' + label + '\n\n';
  
  xlsx += 'RESUMO,\n';
  xlsx += 'Total de Ciclos,' + ciclos.length + '\n';
  xlsx += 'Carvão Produzido (kg),' + ciclos.reduce((s, c) => s + Number(c.qtd || 0), 0) + '\n';
  xlsx += 'Madeira Queimada (m³),' + ciclos.reduce((s, c) => s + Number(c.madeira || 0), 0) + '\n';
  xlsx += 'Vendas (R$),' + vendas.reduce((s, v) => s + Number(v.qtd || 0) * Number(v.preco || 0), 0) + '\n\n';
  
  xlsx += 'CICLOS DE PRODUÇÃO,\n';
  xlsx += 'ID,Forno,Início,Término,Madeira (m³),Carvão (kg),Responsável\n';
  ciclos.forEach(c => {
    xlsx += `${c.id},${fornoName(c.fornoId)},${fmtDate(c.inicio)},${fmtDate(c.fim)},${fmt(c.madeira)},${fmt(c.qtd)},${c.obs}\n`;
  });
  
  xlsx += '\nVENDAS/FORNECIMENTOS,\n';
  xlsx += 'Cliente,Cidade,Data,Quantidade (kg),Valor (R$)\n';
  vendas.forEach(v => {
    xlsx += `${v.nome},${v.cidade},${fmtDate(v.data)},${fmt(v.qtd)},${money(v.qtd * v.preco)}\n`;
  });
  
  downloadFile(xlsx, `relatorio_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  toast('Relatório exportado com sucesso');
}

// Exportar dados completos para backup
function exportBackupCompleto() {
  if (!hasPermission('*')) {
    toast('Sem permissão');
    return;
  }
  
  const backup = {
    timestamp: new Date().toISOString(),
    versao: '2.0',
    usuario: currentUser?.nome,
    dados: {
      fornos: db.fornos,
      producoes: db.producoes,
      clientes: db.clientes,
      ...Object.keys(MODULOS).reduce((acc, k) => (acc[k] = db[k], acc), {})
    }
  };
  
  downloadFile(JSON.stringify(backup, null, 2), `backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  audit('backup', 'Backup completo exportado', {});
  toast('Backup criado com sucesso');
}

// Importar dados de backup
function importBackupCompleto(file) {
  if (!hasPermission('*')) {
    toast('Sem permissão');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.dados) throw new Error('Formato inválido');
      
      Object.assign(db, backup.dados);
      save();
      carregarSupabase();
      renderAll();
      audit('backup_import', 'Backup restaurado', { timestamp: backup.timestamp });
      toast('Backup restaurado com sucesso');
    } catch (err) {
      toast('Erro ao importar backup: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// Exportar lista de clientes
function exportClientesCSV() {
  const clientes = db.clientes.map(c => ({
    'Nome': c.nome,
    'Telefone': c.tel,
    'Cidade': c.cidade,
    'Estado': c.estado,
    'Forno': fornoName(c.fornoId),
    'Status': cliProg(c),
    'Quantidade (kg)': fmt(c.qtd),
    'Preço/kg (R$)': c.preco.toFixed(2),
    'Data Entrega': fmtDate(c.data)
  }));
  exportCSV(clientes, `clientes_${new Date().toISOString().slice(0, 10)}.csv`);
}
