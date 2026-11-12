// Hub de projetos: professores enviam ideias e a equipe de tecnologia analisa e responde.
// O professor acompanha pelo código que recebe ao enviar; o painel do apoio exige a senha
// definida na variável de ambiente PROJETOS_SENHA (configurada no Render).
const crypto = require('crypto');

const STATUS = ['novo', 'em_analise', 'proposta', 'em_andamento', 'concluido', 'arquivado'];
const PRIORIDADES = ['baixa', 'normal', 'alta'];
const DURACAO_SESSAO_MS = 12 * 60 * 60 * 1000;

// ---------- Utilidades ----------

const texto = (v, max = 5000) => (v === undefined || v === null ? '' : String(v)).trim().slice(0, max);
const lista = (v, max = 40) => (Array.isArray(v) ? v.map(x => texto(x, 120)).filter(Boolean).slice(0, max) : []);
const inteiro = v => { const n = parseInt(v, 10); return Number.isInteger(n) && n >= 0 && n < 100000 ? n : null; };
const lerLista = v => { try { const l = JSON.parse(v || '[]'); return Array.isArray(l) ? l : []; } catch { return []; } };

function gerarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return [...crypto.randomBytes(6)].map(b => letras[b % letras.length]).join('');
}

// Evita que um erro dentro de uma rota assíncrona derrube o servidor
const rota = fn => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  }
};

// ---------- Acesso do apoio (senha no servidor) ----------

const senha = () => process.env.PROJETOS_SENHA || '';
const assinar = exp => crypto.createHmac('sha256', senha()).update(String(exp)).digest('hex');

function tokenValido(token) {
  if (!senha() || !token) return false;
  const [exp, assinatura] = String(token).split('.');
  if (!exp || !assinatura || Number(exp) < Date.now()) return false;
  const esperado = assinar(exp);
  return assinatura.length === esperado.length &&
    crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperado));
}

function exigirApoio(req, res, next) {
  const token = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (tokenValido(token)) return next();
  res.status(401).json({ erro: 'Sessão expirada. Entre de novo com a senha.' });
}

// Limita tentativas de senha por IP (10 a cada 15 minutos)
const tentativas = new Map();
function podeTentar(ip) {
  const agora = Date.now();
  const t = tentativas.get(ip);
  if (!t || t.ate < agora) { tentativas.set(ip, { n: 1, ate: agora + 15 * 60 * 1000 }); return true; }
  t.n++;
  return t.n <= 10;
}

// ---------- Formato das respostas ----------

function paraProfessor(p, mensagens) {
  return {
    codigo: p.codigo,
    professor: p.professor,
    disciplina: p.disciplina,
    segmento: p.segmento,
    turma: p.turma,
    titulo: p.titulo,
    conteudo: p.conteudo,
    ideia: p.ideia,
    objetivos: p.objetivos,
    produtos: lerLista(p.produtos),
    data_inicio: p.data_inicio,
    data_entrega: p.data_entrega,
    num_alunos: p.num_alunos,
    aulas: p.aulas,
    recursos_disponiveis: lerLista(p.recursos_disponiveis),
    familiaridade: p.familiaridade,
    links: p.links,
    status: p.status,
    recursos_recomendados: lerLista(p.recursos_recomendados),
    proposta: p.proposta,
    proximos_passos: p.proximos_passos,
    reuniao: p.reuniao,
    criado_em: p.criado_em,
    atualizado_em: p.atualizado_em,
    mensagens: mensagens.map(m => ({ autor: m.autor, texto: m.texto, criado_em: m.criado_em }))
  };
}

function paraApoio(p, mensagens) {
  return {
    ...paraProfessor(p, mensagens),
    id: p.id,
    contato: p.contato,
    prioridade: p.prioridade,
    notas_internas: p.notas_internas,
    mensagens: mensagens.map(m => ({ id: m.id, autor: m.autor, texto: m.texto, criado_em: m.criado_em }))
  };
}

// ---------- Banco ----------

async function criarTabelasProjetos(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projetos (
      id SERIAL PRIMARY KEY,
      codigo TEXT UNIQUE NOT NULL,
      professor TEXT NOT NULL,
      contato TEXT,
      disciplina TEXT NOT NULL,
      segmento TEXT NOT NULL,
      turma TEXT,
      titulo TEXT NOT NULL,
      conteudo TEXT,
      ideia TEXT NOT NULL,
      objetivos TEXT,
      produtos TEXT,
      data_inicio TEXT,
      data_entrega TEXT,
      num_alunos INTEGER,
      aulas INTEGER,
      recursos_disponiveis TEXT,
      familiaridade TEXT,
      links TEXT,
      status TEXT NOT NULL DEFAULT 'novo',
      prioridade TEXT NOT NULL DEFAULT 'normal',
      recursos_recomendados TEXT,
      proposta TEXT,
      proximos_passos TEXT,
      reuniao TEXT,
      notas_internas TEXT,
      visto_em TIMESTAMP,
      criado_em TIMESTAMP DEFAULT NOW(),
      atualizado_em TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projeto_mensagens (
      id SERIAL PRIMARY KEY,
      projeto_id INTEGER NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
      autor TEXT NOT NULL,
      texto TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function buscarMensagens(pool, projetoId) {
  const r = await pool.query('SELECT * FROM projeto_mensagens WHERE projeto_id = $1 ORDER BY criado_em ASC, id ASC', [projetoId]);
  return r.rows;
}

const codigoDe = req => texto(req.params.codigo, 12).toUpperCase();

// ---------- Rotas ----------

function registrarRotasProjetos(app, pool) {

  // Professor envia um novo projeto
  app.post('/api/projetos', rota(async (req, res) => {
    const b = req.body || {};
    const novo = {
      professor: texto(b.professor, 150),
      contato: texto(b.contato, 150),
      disciplina: texto(b.disciplina, 100),
      segmento: texto(b.segmento, 100),
      turma: texto(b.turma, 100),
      titulo: texto(b.titulo, 200),
      conteudo: texto(b.conteudo),
      ideia: texto(b.ideia),
      objetivos: texto(b.objetivos),
      produtos: JSON.stringify(lista(b.produtos)),
      data_inicio: texto(b.data_inicio, 10),
      data_entrega: texto(b.data_entrega, 10),
      num_alunos: inteiro(b.num_alunos),
      aulas: inteiro(b.aulas),
      recursos_disponiveis: JSON.stringify(lista(b.recursos_disponiveis)),
      familiaridade: texto(b.familiaridade, 30),
      links: texto(b.links, 2000)
    };

    if (!novo.professor || !novo.disciplina || !novo.segmento || !novo.titulo || !novo.ideia) {
      return res.status(400).json({ erro: 'Preencha nome, disciplina, segmento, título e a ideia do projeto.' });
    }

    // Gera um código que ainda não exista
    let codigo;
    for (let i = 0; i < 5 && !codigo; i++) {
      const tentativa = gerarCodigo();
      const r = await pool.query('SELECT 1 FROM projetos WHERE codigo = $1', [tentativa]);
      if (r.rows.length === 0) codigo = tentativa;
    }
    if (!codigo) return res.status(500).json({ erro: 'Não foi possível gerar o código. Tente novamente.' });

    const campos = Object.keys(novo);
    await pool.query(
      `INSERT INTO projetos (codigo, ${campos.join(', ')}) VALUES ($1, ${campos.map((_, i) => '$' + (i + 2)).join(', ')})`,
      [codigo, ...campos.map(c => novo[c])]
    );
    res.status(201).json({ codigo });
  }));

  // Professor acompanha o projeto pelo código
  app.get('/api/projetos/acompanhar/:codigo', rota(async (req, res) => {
    const r = await pool.query('SELECT * FROM projetos WHERE codigo = $1', [codigoDe(req)]);
    if (r.rows.length === 0) return res.status(404).json({ erro: 'Nenhum projeto encontrado com esse código.' });
    res.json(paraProfessor(r.rows[0], await buscarMensagens(pool, r.rows[0].id)));
  }));

  // Professor manda uma mensagem
  app.post('/api/projetos/acompanhar/:codigo/mensagens', rota(async (req, res) => {
    const msg = texto((req.body || {}).texto, 3000);
    if (!msg) return res.status(400).json({ erro: 'Escreva a mensagem.' });
    const r = await pool.query('SELECT id FROM projetos WHERE codigo = $1', [codigoDe(req)]);
    if (r.rows.length === 0) return res.status(404).json({ erro: 'Nenhum projeto encontrado com esse código.' });
    await pool.query('INSERT INTO projeto_mensagens (projeto_id, autor, texto) VALUES ($1, $2, $3)', [r.rows[0].id, 'professor', msg]);
    await pool.query('UPDATE projetos SET atualizado_em = NOW() WHERE id = $1', [r.rows[0].id]);
    res.status(201).json({ ok: true });
  }));

  // Entrada no painel do apoio
  app.post('/api/projetos/login', rota(async (req, res) => {
    if (!senha()) {
      return res.status(503).json({ erro: 'A senha do painel ainda não foi configurada no servidor (variável PROJETOS_SENHA).' });
    }
    if (!podeTentar(req.ip)) return res.status(429).json({ erro: 'Muitas tentativas. Espere 15 minutos.' });

    const hash = v => crypto.createHash('sha256').update(String(v)).digest();
    if (!crypto.timingSafeEqual(hash(texto((req.body || {}).senha, 200)), hash(senha()))) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }
    tentativas.delete(req.ip);
    const exp = Date.now() + DURACAO_SESSAO_MS;
    res.json({ token: `${exp}.${assinar(exp)}` });
  }));

  // Lista para o painel
  app.get('/api/projetos', exigirApoio, rota(async (req, res) => {
    const r = await pool.query(`
      SELECT p.id, p.codigo, p.professor, p.disciplina, p.segmento, p.turma, p.titulo, p.produtos,
             p.status, p.prioridade, p.data_inicio, p.data_entrega, p.reuniao, p.criado_em, p.atualizado_em,
             (SELECT COUNT(*) FROM projeto_mensagens m
               WHERE m.projeto_id = p.id AND m.autor = 'professor'
                 AND m.criado_em > COALESCE(p.visto_em, TIMESTAMP '1970-01-01')) AS mensagens_novas
      FROM projetos p
      ORDER BY p.criado_em DESC
    `);
    res.json(r.rows.map(p => ({ ...p, produtos: lerLista(p.produtos), mensagens_novas: Number(p.mensagens_novas) })));
  }));

  // Detalhe para o painel (marca as mensagens como vistas)
  app.get('/api/projetos/:id', exigirApoio, rota(async (req, res) => {
    const id = inteiro(req.params.id);
    const r = await pool.query('SELECT * FROM projetos WHERE id = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ erro: 'Projeto não encontrado.' });
    await pool.query('UPDATE projetos SET visto_em = NOW() WHERE id = $1', [id]);
    res.json(paraApoio(r.rows[0], await buscarMensagens(pool, id)));
  }));

  // Análise do apoio: status, recursos, proposta etc.
  app.patch('/api/projetos/:id', exigirApoio, rota(async (req, res) => {
    const id = inteiro(req.params.id);
    const b = req.body || {};
    const mudancas = {};
    if (b.status !== undefined) {
      if (!STATUS.includes(b.status)) return res.status(400).json({ erro: 'Status inválido.' });
      mudancas.status = b.status;
    }
    if (b.prioridade !== undefined) {
      if (!PRIORIDADES.includes(b.prioridade)) return res.status(400).json({ erro: 'Prioridade inválida.' });
      mudancas.prioridade = b.prioridade;
    }
    if (b.recursos_recomendados !== undefined) mudancas.recursos_recomendados = JSON.stringify(lista(b.recursos_recomendados));
    for (const campo of ['proposta', 'proximos_passos', 'notas_internas']) {
      if (b[campo] !== undefined) mudancas[campo] = texto(b[campo], 10000);
    }
    if (b.reuniao !== undefined) mudancas.reuniao = texto(b.reuniao, 16);

    const campos = Object.keys(mudancas);
    if (campos.length === 0) return res.status(400).json({ erro: 'Nada para atualizar.' });

    const r = await pool.query(
      `UPDATE projetos SET ${campos.map((c, i) => `${c} = $${i + 2}`).join(', ')}, atualizado_em = NOW() WHERE id = $1`,
      [id, ...campos.map(c => mudancas[c])]
    );
    if (r.rowCount === 0) return res.status(404).json({ erro: 'Projeto não encontrado.' });
    res.json({ ok: true });
  }));

  // Apoio responde por mensagem
  app.post('/api/projetos/:id/mensagens', exigirApoio, rota(async (req, res) => {
    const id = inteiro(req.params.id);
    const msg = texto((req.body || {}).texto, 3000);
    if (!msg) return res.status(400).json({ erro: 'Escreva a mensagem.' });
    const r = await pool.query('SELECT id FROM projetos WHERE id = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ erro: 'Projeto não encontrado.' });
    await pool.query('INSERT INTO projeto_mensagens (projeto_id, autor, texto) VALUES ($1, $2, $3)', [id, 'apoio', msg]);
    await pool.query('UPDATE projetos SET atualizado_em = NOW(), visto_em = NOW() WHERE id = $1', [id]);
    res.status(201).json({ ok: true });
  }));

  // Excluir projeto (e as mensagens dele)
  app.delete('/api/projetos/:id', exigirApoio, rota(async (req, res) => {
    const r = await pool.query('DELETE FROM projetos WHERE id = $1', [inteiro(req.params.id)]);
    if (r.rowCount === 0) return res.status(404).json({ erro: 'Projeto não encontrado.' });
    res.json({ ok: true });
  }));
}

module.exports = { criarTabelasProjetos, registrarRotasProjetos };
