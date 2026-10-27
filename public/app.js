// Utilidades compartilhadas entre as páginas

// Aplica o tema salvo antes de desenhar a página (evita "piscar")
(function () {
  try {
    const tema = localStorage.getItem('tema');
    if (tema) document.documentElement.dataset.theme = tema;
  } catch {}
})();

const ICONE_SOL = '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const ICONE_LUA = '<svg class="ic" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

function temaAtual() {
  const definido = document.documentElement.dataset.theme;
  if (definido) return definido;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function atualizarBotaoTema() {
  const btn = document.getElementById('btn-tema');
  if (!btn) return;
  const escuro = temaAtual() === 'dark';
  btn.innerHTML = escuro ? ICONE_SOL : ICONE_LUA;
  btn.title = escuro ? 'Usar tema claro' : 'Usar tema escuro';
  btn.setAttribute('aria-label', btn.title);
}

document.addEventListener('DOMContentLoaded', () => {
  atualizarBotaoTema();
  const btn = document.getElementById('btn-tema');
  if (btn) btn.addEventListener('click', () => {
    const novo = temaAtual() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = novo;
    try { localStorage.setItem('tema', novo); } catch {}
    atualizarBotaoTema();
  });
});

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
