// Configuração e cálculo de disponibilidade dos computadores.
// Não acessa o banco: recebe a lista do que está ocupado e devolve quantos sobram em cada trecho do dia.

// ---------- Configuração (edite aqui) ----------

// Total de computadores que a escola tem para emprestar
const TOTAL_COMPUTADORES = 15;

// Janela do dia em que é possível reservar
const ABERTURA = '07:00';
const FECHAMENTO = '18:00';

// Antecedência mínima: só é possível reservar para daqui a pelo menos estas horas
const ANTECEDENCIA_HORAS = 12;

// Aulas fixas que já usam computadores toda semana.
// dia: 1 = segunda, 2 = terça, 3 = quarta, 4 = quinta, 5 = sexta
// emUso: quantos computadores a aula ocupa (15 - 10 = 5 livres nesses horários)
const AULAS_FIXAS = [
  { dia: 2, inicio: '09:25', fim: '10:15', turma: '1ºB', emUso: 10 },
  { dia: 2, inicio: '10:15', fim: '11:05', turma: '1ºA', emUso: 10 },
  { dia: 3, inicio: '11:05', fim: '12:00', turma: '3ºA', emUso: 10 },
  { dia: 4, inicio: '07:00', fim: '07:40', turma: '3ºB', emUso: 10 },
  { dia: 4, inicio: '08:20', fim: '09:05', turma: '5ºA', emUso: 10 },
  { dia: 4, inicio: '09:25', fim: '10:15', turma: '5ºB', emUso: 10 },
  { dia: 5, inicio: '09:25', fim: '10:15', turma: '2ºB', emUso: 10 },
  { dia: 5, inicio: '10:15', fim: '11:05', turma: '2ºA', emUso: 10 },
  { dia: 5, inicio: '11:05', fim: '12:00', turma: '4ºA', emUso: 10 }
];

// ---------- Cálculo ----------

// "07:30" -> 450
function emMinutos(horario) {
  const [h, m] = horario.split(':').map(Number);
  return h * 60 + m;
}

// 450 -> "07:30"
function emHorario(minutos) {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

// Data + horário (de Brasília) -> minutos corridos, para comparar momentos de dias diferentes
function minutosAbsolutos(data, horario) {
  const [y, m, d] = data.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 60000 + emMinutos(horario);
}

// Minutos corridos -> { data: 'AAAA-MM-DD', horario: 'HH:MM' }
function deMinutosAbsolutos(minutos) {
  const dt = new Date(minutos * 60000);
  const data = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
  return { data, horario: emHorario(dt.getUTCHours() * 60 + dt.getUTCMinutes()) };
}

// Primeiro momento que pode ser reservado, a partir de "agora" em Brasília
function reservaMinima(agoraData, agoraHorario) {
  return deMinutosAbsolutos(minutosAbsolutos(agoraData, agoraHorario) + ANTECEDENCIA_HORAS * 60);
}

// Aulas fixas que acontecem na data (AAAA-MM-DD), no formato de ocupação
function aulasFixasDoDia(data) {
  const [y, m, d] = data.split('-').map(Number);
  const diaSemana = new Date(y, m - 1, d).getDay();
  return AULAS_FIXAS
    .filter(a => a.dia === diaSemana)
    .map(a => ({ tipo: 'aula', inicio: a.inicio, fim: a.fim, quantidade: a.emUso, descricao: `Aula fixa do ${a.turma}` }));
}

// Divide o dia em trechos contínuos com a mesma quantidade de computadores livres
function calcularSegmentos(ocupacoes) {
  const abertura = emMinutos(ABERTURA);
  const fechamento = emMinutos(FECHAMENTO);
  const limitar = m => Math.min(Math.max(m, abertura), fechamento);

  const pontos = new Set([abertura, fechamento]);
  ocupacoes.forEach(o => {
    pontos.add(limitar(emMinutos(o.inicio)));
    pontos.add(limitar(emMinutos(o.fim)));
  });
  const ordenados = [...pontos].sort((a, b) => a - b);

  const segmentos = [];
  for (let i = 0; i < ordenados.length - 1; i++) {
    const de = ordenados[i];
    const ate = ordenados[i + 1];
    const usados = ocupacoes
      .filter(o => emMinutos(o.inicio) <= de && de < emMinutos(o.fim))
      .reduce((soma, o) => soma + o.quantidade, 0);
    const livres = Math.max(TOTAL_COMPUTADORES - usados, 0);

    const anterior = segmentos[segmentos.length - 1];
    if (anterior && anterior.livres === livres) {
      anterior.fim = emHorario(ate);
    } else {
      segmentos.push({ inicio: emHorario(de), fim: emHorario(ate), livres });
    }
  }
  return segmentos;
}

// Trechos do dia que se sobrepõem ao intervalo [inicio, fim)
function segmentosNoIntervalo(segmentos, inicio, fim) {
  return segmentos.filter(s => emMinutos(s.inicio) < emMinutos(fim) && emMinutos(s.fim) > emMinutos(inicio));
}

const Computadores = {
  TOTAL_COMPUTADORES, ABERTURA, FECHAMENTO, ANTECEDENCIA_HORAS, AULAS_FIXAS,
  emMinutos, emHorario, minutosAbsolutos, reservaMinima,
  aulasFixasDoDia, calcularSegmentos, segmentosNoIntervalo
};

if (typeof module !== 'undefined') module.exports = Computadores;
