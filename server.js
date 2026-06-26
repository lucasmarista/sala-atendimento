const express = require('express');
const { Pool } = require('pg');
const path = require('path');

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

inicializarBanco().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao conectar ao banco de dados:', err.message);
  process.exit(1);
});
