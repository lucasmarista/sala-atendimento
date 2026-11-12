// Utilidades compartilhadas entre as páginas

// Senha das páginas do relatório (secretaria e projetos). Fica no navegador:
// afasta curiosos, mas quem abrir o código-fonte consegue vê-la.
const SENHA_RELATORIO = 'M@rista2026';

function relatorioLiberado() {
  try { return sessionStorage.getItem('relatorio_auth') === '1'; } catch { return false; }
}

// Mostra a tela de senha (#tela-senha) até a pessoa acertar; depois chama aoLiberar
function protegerRelatorio(aoLiberar) {
  const tela = document.getElementById('tela-senha');
  const campo = document.getElementById('input-senha');
  const erro = document.getElementById('senha-erro');
  const entrar = () => {
    if (campo.value === SENHA_RELATORIO) {
      try { sessionStorage.setItem('relatorio_auth', '1'); } catch {}
      tela.classList.remove('visivel');
      aoLiberar();
    } else {
      erro.style.display = 'block';
      campo.value = '';
      campo.focus();
    }
  };
  document.getElementById('btn-entrar').addEventListener('click', entrar);
  campo.addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });

  if (relatorioLiberado()) {
    aoLiberar();
  } else {
    tela.classList.add('visivel');
    campo.focus();
  }
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatarData(dataISO, opcoes = { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) {
  const [y, m, d] = dataISO.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('pt-BR', opcoes);
}

// "2026-11-20T14:30" -> "sexta-feira, 20 de novembro às 14:30"
function formatarDataHora(valor) {
  const [data, hora] = String(valor || '').split('T');
  if (!data) return '';
  return formatarData(data, { weekday: 'long', day: '2-digit', month: 'long' }) + (hora ? ` às ${hora.slice(0, 5)}` : '');
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
