// ============================================================================
// SINCRONIZAÇÃO AVANÇADA OFFLINE/ONLINE
// ============================================================================

const SYNC_QUEUE_LS = 'carvao360_sync_queue';
const LAST_SYNC_LS = 'carvao360_last_sync';

class SyncManager {
  constructor() {
    this.syncing = false;
    this.lastSync = localStorage.getItem(LAST_SYNC_LS) || null;
    this.queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_LS) || '[]');
  }
  
  // Adicionar operação à fila
  enqueue(op) {
    this.queue.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...op
    });
    this.save();
  }
  
  // Adicionar operação CRUD
  addCRUD(tabela, oper, id, dados) {
    this.enqueue({
      tabela,
      operacao: oper, // 'create', 'update', 'delete'
      id,
      dados,
      tentativas: 0
    });
  }
  
  // Sincronizar com servidor
  async sync() {
    if (!supaOnline || this.syncing || this.queue.length === 0) {
      return { ok: true, sincronizados: 0 };
    }
    
    this.syncing = true;
    let sincronizados = 0;
    const falhados = [];
    
    for (const op of this.queue) {
      if (op.tentativas >= 3) {
        falhados.push(op);
        continue;
      }
      
      try {
        if (op.operacao === 'create') {
          await api(op.tabela, {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify(op.dados)
          });
        } else if (op.operacao === 'update') {
          await api(`${op.tabela}?id=eq.${op.id}`, {
            method: 'PATCH',
            body: JSON.stringify(op.dados)
          });
        } else if (op.operacao === 'delete') {
          await api(`${op.tabela}?id=eq.${op.id}`, { method: 'DELETE' });
        }
        sincronizados++;
      } catch (e) {
        op.tentativas++;
        falhados.push(op);
      }
    }
    
    // Remover operações bem-sucedidas
    this.queue = falhados;
    this.save();
    this.lastSync = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_LS, this.lastSync);
    
    this.syncing = false;
    return { ok: true, sincronizados, falhados: falhados.length };
  }
  
  save() {
    localStorage.setItem(SYNC_QUEUE_LS, JSON.stringify(this.queue));
  }
  
  getPendentes() {
    return this.queue;
  }
}

const syncMgr = new SyncManager();

// Sincronizar quando volta online
window.addEventListener('online', () => {
  console.log('Online - sincronizando...');
  syncMgr.sync().then(r => {
    if (r.sincronizados > 0) {
      toast(`${r.sincronizados} operações sincronizadas`);
      carregarSupabase();
      renderAll();
    }
  });
});

// Sincronizar periodicamente
setInterval(() => {
  if (navigator.onLine && supaOnline) {
    syncMgr.sync();
  }
}, 60 * 1000); // A cada 1 minuto
