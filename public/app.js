// Utilidades compartilhadas entre as páginas

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatarData(dataISO, opcoes = { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) {
  const [y, m, d] = dataISO.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('pt-BR', opcoes);
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Mostra uma mensagem (.mensagem) com o texto informado
function mostrarMensagem(id, texto) {
  const el = document.getElementById(id);
  el.querySelector('span').textContent = texto;
  el.classList.add('visivel');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function ocultarMensagens() {
  document.querySelectorAll('.mensagem').forEach(m => m.classList.remove('visivel'));
}

// Desenha os horários agrupados em Manhã / Tarde
function desenharTurnos(container, horarios, criarChip) {
  const turnos = [
    { nome: 'Manhã', itens: horarios.filter(h => h < '12:00') },
    { nome: 'Tarde', itens: horarios.filter(h => h >= '12:00') }
  ];
  container.innerHTML = '';
  turnos.filter(t => t.itens.length).forEach(t => {
    const bloco = document.createElement('div');
    bloco.className = 'turno';
    bloco.innerHTML = `<div class="turno-nome">${t.nome}</div>`;
    const grid = document.createElement('div');
    grid.className = 'horarios-grid';
    t.itens.forEach(h => grid.appendChild(criarChip(h)));
    bloco.appendChild(grid);
    container.appendChild(bloco);
  });
}
