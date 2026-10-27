const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const {
  TOTAL_COMPUTADORES, ABERTURA, FECHAMENTO,
  emMinutos, aulasFixasDoDia, calcularSegmentos, segmentosNoIntervalo
} = require('./computadores');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexão com o Supabase (via variável de ambiente DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Inicializar tabela (roda uma vez na primeira conexão)
async function inicializarBanco() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      sala TEXT NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      nome_aluno TEXT NOT NULL,
      nome_responsavel TEXT NOT NULL,
      nome_professor TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas_computadores (
      id SERIAL PRIMARY KEY,
      data TEXT NOT NULL,
      horario_inicio TEXT NOT NULL,
      horario_fim TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      nome_professor TEXT NOT NULL,
      turma TEXT NOT NULL,
      observacao TEXT,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('Banco de dados pronto.');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Horários disponíveis (07:00 às 18:00 de 30 em 30 min)
function gerarHorarios() {
  const horarios = [];
  for (let h = 7; h < 18; h++) {
    horarios.push(`${String(h).padStart(2, '0')}:00`);
    horarios.push(`${String(h).padStart(2, '0')}:30`);
  }
  return horarios;
}

const REGEX_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

// Data de hoje no fuso de Brasília (o servidor do Render roda em UTC)
function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

// Tudo o que ocupa computadores numa data: aulas fixas do dia da semana + reservas feitas
async function buscarOcupacoes(db, data) {
  const result = await db.query(
    'SELECT horario_inicio, horario_fim, quantidade, nome_professor, turma FROM reservas_computadores WHERE data = $1',
    [data]
  );
  const reservas = result.rows.map(r => ({
    tipo: 'reserva',
    inicio: r.horario_inicio,
    fim: r.horario_fim,
    quantidade: r.quantidade,
    descricao: `${r.nome_professor} (${r.turma})`
  }));

  return [...aulasFixasDoDia(data), ...reservas];
}

// GET /api/horarios-disponiveis?data=YYYY-MM-DD&sala=Sala1
app.get('/api/horarios-disponiveis', async (req, res) => {
  const { data, sala } = req.query;
  if (!data || !sala) {
    return res.status(400).json({ erro: 'Parâmetros data e sala são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      'SELECT horario FROM agendamentos WHERE data = $1 AND sala = $2',
      [data, sala]
    );
    const reservados = result.rows.map(r => r.horario);
    const todos = gerarHorarios();
    const disponiveis = todos.filter(h => !reservados.includes(h));
    res.json({ disponiveis, reservados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao consultar horários.' });
  }
});

// POST /api/agendamentos
app.post('/api/agendamentos', async (req, res) => {
  const { sala, data, horario, nome_aluno, nome_responsavel, nome_professor } = req.body;

  if (!sala || !data || !horario || !nome_aluno || !nome_responsavel || !nome_professor) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  try {
    // Verificar se o horário ainda está disponível
    const existente = await pool.query(
      'SELECT id FROM agendamentos WHERE sala = $1 AND data = $2 AND horario = $3',
      [sala, data, horario]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({ erro: 'Este horário já foi reservado. Por favor, escolha outro.' });
    }

    const result = await pool.query(
      'INSERT INTO agendamentos (sala, data, horario, nome_aluno, nome_responsavel, nome_professor) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [sala, data, horario, nome_aluno.trim(), nome_responsavel.trim(), nome_professor.trim()]
    );

    res.status(201).json({ id: result.rows[0].id, mensagem: 'Agendamento realizado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao realizar agendamento.' });
  }
});

// GET /api/agendamentos?data=YYYY-MM-DD
app.get('/api/agendamentos', async (req, res) => {
  const { data } = req.query;

  try {
    let query, params;
    if (data) {
      query = 'SELECT * FROM agendamentos WHERE data = $1 ORDER BY data ASC, horario ASC, sala ASC';
      params = [data];
    } else {
      query = 'SELECT * FROM agendamentos ORDER BY data ASC, sala ASC, horario ASC';
      params = [];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
  }
});

// DELETE /api/agendamentos/:id
app.delete('/api/agendamentos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM agendamentos WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    res.json({ mensagem: 'Agendamento cancelado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cancelar agendamento.' });
  }
});

// ---------- Reservas de computadores ----------

// GET /api/computadores/disponibilidade?data=YYYY-MM-DD
app.get('/api/computadores/disponibilidade', async (req, res) => {
  const { data } = req.query;
  if (!data || !REGEX_DATA.test(data)) {
    return res.status(400).json({ erro: 'Parâmetro data é obrigatório (AAAA-MM-DD).' });
  }

  try {
    const ocupacoes = await buscarOcupacoes(pool, data);
    res.json({
      total: TOTAL_COMPUTADORES,
      abertura: ABERTURA,
      fechamento: FECHAMENTO,
      segmentos: calcularSegmentos(ocupacoes),
      ocupacoes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao consultar disponibilidade.' });
  }
});

// POST /api/computadores
app.post('/api/computadores', async (req, res) => {
  // Converte tudo para texto para um pedido malformado não derrubar o servidor
  const texto = v => (v === undefined || v === null ? '' : String(v)).trim();
  const data = texto(req.body.data);
  const horario_inicio = texto(req.body.horario_inicio);
  const horario_fim = texto(req.body.horario_fim);
  const nome_professor = texto(req.body.nome_professor);
  const turma = texto(req.body.turma);
  const observacao = texto(req.body.observacao);
  const quantidade = Number(req.body.quantidade);

  if (!data || !horario_inicio || !horario_fim || !nome_professor || !turma) {
    return res.status(400).json({ erro: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }
  if (!REGEX_DATA.test(data) || data < hojeBrasil()) {
    return res.status(400).json({ erro: 'Data inválida ou já passou.' });
  }
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > TOTAL_COMPUTADORES) {
    return res.status(400).json({ erro: `A quantidade deve ser entre 1 e ${TOTAL_COMPUTADORES}.` });
  }
  if (!REGEX_HORARIO.test(horario_inicio) || !REGEX_HORARIO.test(horario_fim) ||
      emMinutos(horario_inicio) < emMinutos(ABERTURA) || emMinutos(horario_fim) > emMinutos(FECHAMENTO) ||
      emMinutos(horario_fim) <= emMinutos(horario_inicio)) {
    return res.status(400).json({ erro: `Escolha um horário entre ${ABERTURA} e ${FECHAMENTO}, com o fim depois do início.` });
  }

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao conectar ao banco de dados.' });
  }

  try {
    await client.query('BEGIN');
    // Trava as reservas deste dia: se dois professores confirmarem ao mesmo tempo,
    // o segundo espera o primeiro terminar e já enxerga os computadores que foram subtraídos
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`computadores|${data}`]);

    const ocupacoes = await buscarOcupacoes(client, data);
    const conflito = segmentosNoIntervalo(calcularSegmentos(ocupacoes), horario_inicio, horario_fim)
      .find(s => s.livres < quantidade);

    if (conflito) {
      await client.query('ROLLBACK');
      const de = emMinutos(conflito.inicio) < emMinutos(horario_inicio) ? horario_inicio : conflito.inicio;
      const ate = emMinutos(conflito.fim) > emMinutos(horario_fim) ? horario_fim : conflito.fim;
      return res.status(409).json({
        erro: `Das ${de} às ${ate} só há ${conflito.livres} computador(es) livre(s). Ajuste a quantidade ou o horário.`
      });
    }

    const result = await client.query(
      `INSERT INTO reservas_computadores (data, horario_inicio, horario_fim, quantidade, nome_professor, turma, observacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [data, horario_inicio, horario_fim, quantidade, nome_professor, turma, observacao || null]
    );
    await client.query('COMMIT');

    res.status(201).json({ id: result.rows[0].id, mensagem: 'Reserva realizada com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ erro: 'Erro ao realizar reserva.' });
  } finally {
    client.release();
  }
});

// GET /api/computadores?data=YYYY-MM-DD
app.get('/api/computadores', async (req, res) => {
  const { data } = req.query;

  try {
    const result = data
      ? await pool.query('SELECT * FROM reservas_computadores WHERE data = $1 ORDER BY horario_inicio ASC', [data])
      : await pool.query('SELECT * FROM reservas_computadores ORDER BY data ASC, horario_inicio ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar reservas.' });
  }
});

// DELETE /api/computadores/:id
app.delete('/api/computadores/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reservas_computadores WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Reserva não encontrada.' });
    }
    res.json({ mensagem: 'Reserva cancelada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cancelar reserva.' });
  }
});

inicializarBanco().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao conectar ao banco de dados:', err.message);
  process.exit(1);
});
