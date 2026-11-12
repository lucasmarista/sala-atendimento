// Listas usadas pelo hub de projetos (edite aqui para adicionar disciplinas ou ferramentas)

const DISCIPLINAS = [
  'Arte', 'Biologia', 'Ciências', 'Educação Física', 'Ensino Religioso', 'Espanhol', 'Filosofia',
  'Física', 'Geografia', 'História', 'Inglês', 'Língua Portuguesa', 'Literatura', 'Matemática',
  'Projeto de Vida', 'Química', 'Redação', 'Sociologia', 'Interdisciplinar', 'Outra'
];

const SEGMENTOS = ['Educação Infantil', 'Fundamental I (1º ao 5º ano)', 'Fundamental II (6º ao 9º ano)', 'Ensino Médio'];

// O que os alunos vão produzir
const PRODUTOS = [
  { id: 'apresentacao', nome: 'Apresentação' },
  { id: 'video', nome: 'Vídeo' },
  { id: 'podcast', nome: 'Podcast ou áudio' },
  { id: 'jogo', nome: 'Jogo ou quiz' },
  { id: 'site', nome: 'Site ou blog' },
  { id: 'livro', nome: 'Livro digital ou HQ' },
  { id: 'mural', nome: 'Mural ou mapa mental' },
  { id: 'maquete', nome: 'Maquete ou modelo 3D' },
  { id: 'programacao', nome: 'Programação ou robótica' },
  { id: 'simulacao', nome: 'Experimento ou simulação' },
  { id: 'pesquisa', nome: 'Pesquisa ou questionário' },
  { id: 'mapa', nome: 'Mapa ou linha do tempo' },
  { id: 'naosei', nome: 'Ainda não sei, quero sugestões' }
];

// O que o professor já tem à disposição
const RECURSOS_DISPONIVEIS = [
  'Computadores da escola', 'Celulares dos alunos', 'Internet', 'Projetor ou TV',
  'Sala de informática', 'Materiais de papelaria', 'Nenhum, preciso de ajuda'
];

const FAMILIARIDADE = [
  { id: 'pouca', nome: 'Pouca', info: 'Prefiro algo bem simples' },
  { id: 'media', nome: 'Média', info: 'Uso algumas ferramentas' },
  { id: 'muita', nome: 'Muita', info: 'Topo testar coisas novas' }
];

const STATUS_PROJETO = [
  { id: 'novo', nome: 'Recebido', info: 'Seu projeto chegou e logo será analisado.' },
  { id: 'em_analise', nome: 'Em análise', info: 'Estamos estudando a melhor forma de aplicar a sua ideia.' },
  { id: 'proposta', nome: 'Proposta pronta', info: 'Já temos uma sugestão de como fazer. Veja abaixo.' },
  { id: 'em_andamento', nome: 'Em andamento', info: 'O projeto está sendo aplicado com as turmas.' },
  { id: 'concluido', nome: 'Concluído', info: 'Projeto finalizado. Obrigado por compartilhar!' },
  { id: 'arquivado', nome: 'Arquivado', info: 'Este projeto foi arquivado.' }
];

// Catálogo de ferramentas: "produtos" liga cada ferramenta ao que os alunos vão produzir
const RECURSOS = [
  { id: 'canva', nome: 'Canva', categoria: 'Criação visual', link: 'https://www.canva.com/education/', produtos: ['apresentacao', 'video', 'livro', 'mural', 'mapa'], descricao: 'Apresentações, cartazes, infográficos e vídeos curtos com modelos prontos. Tem plano gratuito para educação.' },
  { id: 'slides', nome: 'Google Apresentações', categoria: 'Criação visual', link: 'https://slides.google.com', produtos: ['apresentacao'], descricao: 'Apresentações feitas em grupo, ao mesmo tempo, direto no navegador.' },
  { id: 'genially', nome: 'Genially', categoria: 'Criação visual', link: 'https://genially.com', produtos: ['apresentacao', 'jogo', 'mapa'], descricao: 'Apresentações interativas, escape rooms e linhas do tempo clicáveis.' },
  { id: 'capcut', nome: 'CapCut', categoria: 'Vídeo e áudio', link: 'https://www.capcut.com', produtos: ['video'], descricao: 'Edição de vídeo simples pelo celular ou computador, com legendas automáticas.' },
  { id: 'clipchamp', nome: 'Clipchamp', categoria: 'Vídeo e áudio', link: 'https://clipchamp.com', produtos: ['video'], descricao: 'Editor de vídeo no navegador, com gravação de tela e narração.' },
  { id: 'audacity', nome: 'Audacity', categoria: 'Vídeo e áudio', link: 'https://www.audacityteam.org', produtos: ['podcast'], descricao: 'Gravação e edição de áudio gratuita para podcasts e narrações.' },
  { id: 'soundtrap', nome: 'Soundtrap', categoria: 'Vídeo e áudio', link: 'https://www.soundtrap.com/edu', produtos: ['podcast'], descricao: 'Estúdio de áudio on-line, com gravação em grupo e trilhas prontas.' },
  { id: 'kahoot', nome: 'Kahoot!', categoria: 'Jogos e avaliação', link: 'https://kahoot.com/schools/', produtos: ['jogo', 'pesquisa'], descricao: 'Quiz ao vivo em sala, com os alunos respondendo pelo celular ou computador.' },
  { id: 'wordwall', nome: 'Wordwall', categoria: 'Jogos e avaliação', link: 'https://wordwall.net/pt', produtos: ['jogo'], descricao: 'Jogos prontos (roleta, forca, associação) criados em minutos a partir do conteúdo.' },
  { id: 'forms', nome: 'Google Formulários', categoria: 'Jogos e avaliação', link: 'https://forms.google.com', produtos: ['pesquisa', 'jogo'], descricao: 'Questionários, pesquisas e testes com correção automática.' },
  { id: 'mentimeter', nome: 'Mentimeter', categoria: 'Jogos e avaliação', link: 'https://www.mentimeter.com', produtos: ['pesquisa', 'apresentacao'], descricao: 'Votações e nuvens de palavras ao vivo durante a aula.' },
  { id: 'padlet', nome: 'Padlet', categoria: 'Colaboração', link: 'https://padlet.com', produtos: ['mural', 'mapa', 'pesquisa'], descricao: 'Mural on-line onde a turma posta textos, imagens, vídeos e links.' },
  { id: 'miro', nome: 'Miro', categoria: 'Colaboração', link: 'https://miro.com/education/', produtos: ['mural', 'mapa'], descricao: 'Quadro branco infinito para mapas mentais e organização de ideias em grupo.' },
  { id: 'docs', nome: 'Google Documentos', categoria: 'Colaboração', link: 'https://docs.google.com', produtos: ['pesquisa', 'livro'], descricao: 'Textos escritos em grupo, com comentários e histórico de quem escreveu o quê.' },
  { id: 'sites', nome: 'Google Sites', categoria: 'Publicação', link: 'https://sites.google.com', produtos: ['site'], descricao: 'Sites simples montados arrastando blocos, sem precisar programar.' },
  { id: 'bookcreator', nome: 'Book Creator', categoria: 'Publicação', link: 'https://bookcreator.com', produtos: ['livro'], descricao: 'Livros digitais com texto, imagens, áudio e vídeo.' },
  { id: 'pixton', nome: 'Pixton', categoria: 'Publicação', link: 'https://www.pixton.com', produtos: ['livro'], descricao: 'Histórias em quadrinhos com personagens personalizáveis.' },
  { id: 'scratch', nome: 'Scratch', categoria: 'Programação e robótica', link: 'https://scratch.mit.edu', produtos: ['programacao', 'jogo', 'simulacao'], descricao: 'Programação em blocos para criar jogos, animações e histórias interativas.' },
  { id: 'makecode', nome: 'micro:bit MakeCode', categoria: 'Programação e robótica', link: 'https://makecode.microbit.org', produtos: ['programacao', 'simulacao'], descricao: 'Programação de placas micro:bit, com simulador no navegador.' },
  { id: 'codeorg', nome: 'Code.org', categoria: 'Programação e robótica', link: 'https://code.org', produtos: ['programacao'], descricao: 'Cursos e desafios de programação para iniciantes, de todas as idades.' },
  { id: 'tinkercad', nome: 'Tinkercad', categoria: 'Programação e robótica', link: 'https://www.tinkercad.com', produtos: ['maquete', 'programacao', 'simulacao'], descricao: 'Modelagem 3D e circuitos eletrônicos simulados, direto no navegador.' },
  { id: 'minecraft', nome: 'Minecraft Education', categoria: 'Mundos virtuais', link: 'https://education.minecraft.net', produtos: ['maquete', 'programacao', 'jogo'], descricao: 'Construções e mundos em bloco para recriar lugares, épocas e conceitos.' },
  { id: 'phet', nome: 'PhET Simulações', categoria: 'Ciências e matemática', link: 'https://phet.colorado.edu/pt_BR/', produtos: ['simulacao'], descricao: 'Simulações interativas gratuitas de física, química, biologia e matemática.' },
  { id: 'geogebra', nome: 'GeoGebra', categoria: 'Ciências e matemática', link: 'https://www.geogebra.org', produtos: ['simulacao', 'mapa'], descricao: 'Geometria, gráficos e funções interativas.' },
  { id: 'earth', nome: 'Google Earth', categoria: 'Ciências e matemática', link: 'https://earth.google.com', produtos: ['mapa', 'apresentacao'], descricao: 'Mapas 3D e passeios guiados por lugares do mundo.' },
  { id: 'ia', nome: 'IA generativa (Gemini, ChatGPT, Claude)', categoria: 'Inteligência artificial', link: '', produtos: ['pesquisa', 'livro', 'apresentacao'], descricao: 'Ajuda a gerar ideias, roteiros e atividades. Recomendado para uso do professor ou com supervisão.' }
];

// Ferramentas que combinam com o que o professor quer produzir (em ordem de quantas combinam)
function sugerirRecursos(produtos) {
  const alvo = (produtos || []).filter(p => p !== 'naosei');
  if (!alvo.length) return [];
  return RECURSOS
    .map(r => ({ r, n: r.produtos.filter(p => alvo.includes(p)).length }))
    .filter(x => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map(x => x.r);
}

const nomeProduto = id => (PRODUTOS.find(p => p.id === id) || { nome: id }).nome;
const statusProjeto = id => STATUS_PROJETO.find(s => s.id === id) || STATUS_PROJETO[0];
const recursoPorId = id => RECURSOS.find(r => r.id === id);
