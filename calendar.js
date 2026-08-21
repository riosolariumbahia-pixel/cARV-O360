// ============================================================================
// CALENDÁRIO VISUAL
// ============================================================================

function renderCalendar(ano, mes, elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  const primeirodia = new Date(ano, mes, 1).getDay();
  const diasmes = new Date(ano, mes + 1, 0).getDate();
  
  let html = `<div style="background:var(--panel);border-radius:10px;padding:16px">`;
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">`;
  html += `<h3>${MES[mes]} ${ano}</h3>`;
  html += `<div style="display:flex;gap:8px">`;
  html += `<button class="btn sm sec" onclick="mudamismes(${mes - 1},${ano})">←</button>`;
  html += `<button class="btn sm sec" onclick="mudamismes(${mes + 1},${ano})">→</button>`;
  html += `</div></div>`;
  
  html += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center">`;
  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].forEach(d => {
    html += `<div style="font-weight:700;color:var(--muted);font-size:11px;padding:8px 0">${d}</div>`;
  });
  
  for (let i = 0; i < primeirodia; i++) html += `<div></div>`;
  
  const hoje = new Date();
  for (let dia = 1; dia <= diasmes; dia++) {
    const data = new Date(ano, mes, dia);
    const eventos = db.producoes.filter(p => {
      if (!p.inicio) return false;
      const d = new Date(p.inicio + 'T12:00');
      return d.getDate() === dia && d.getMonth() === mes && d.getFullYear() === ano;
    }).length +
    db.clientes.filter(c => {
      if (!c.data) return false;
      const d = new Date(c.data + 'T12:00');
      return d.getDate() === dia && d.getMonth() === mes && d.getFullYear() === ano;
    }).length;
    
    const ehoje = data.toDateString() === hoje.toDateString();
    const style = `padding:8px;border-radius:6px;cursor:pointer;background:${ehoje ? 'var(--accent)' : 'var(--panel2)'};color:${ehoje ? '#111' : 'var(--txt)'}`;
    html += `<div style="${style}" title="${eventos} eventos">${dia}${eventos ? '<br><small>●</small>' : ''}</div>`;
  }
  
  html += `</div></div>`;
  el.innerHTML = html;
}

function mudamismes(mes, ano) {
  if (mes < 0) { mes = 11; ano--; }
  if (mes > 11) { mes = 0; ano++; }
  renderCalendar(ano, mes, 'calendario');
}
