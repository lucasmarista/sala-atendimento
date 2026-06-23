# Como configurar e rodar o sistema

---

## PARTE 1 — Configurar o banco de dados no Supabase

### 1. Criar conta e projeto
1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em **New Project**
3. Dê um nome (ex: `sala-atendimento`) e defina uma senha para o banco
4. Escolha a região **South America (São Paulo)** e clique em **Create Project**
5. Aguarde ~2 minutos até o projeto ficar pronto

### 2. Pegar a string de conexão
1. No menu lateral, clique em **Project Settings** (ícone de engrenagem)
2. Clique em **Database**
3. Role até **Connection string** e selecione a aba **URI**
4. Copie a string — ela tem este formato:
   ```
   postgresql://postgres:[SUA-SENHA]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. Substitua `[YOUR-PASSWORD]` pela senha que você definiu no passo anterior

> Guarde essa string com segurança — é a senha do seu banco.

---

## PARTE 2 — Rodar localmente (para testar)

### 1. Instalar Node.js (uma única vez)
Acesse https://nodejs.org e baixe a versão **LTS**.

### 2. Criar o arquivo de variáveis de ambiente
Na pasta do projeto, crie um arquivo chamado `.env` com o conteúdo:

```
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
```

(cole a string que você copiou do Supabase)

### 3. Instalar dependências e rodar
Abra o terminal no VSCode (`Ctrl+J`) com a pasta `sala-atendimento` aberta:

```
npm install
npm install dotenv
node -e "require('dotenv').config(); require('./server.js')"
```

Ou, mais simples: adicione `require('dotenv').config()` no início do `server.js` para testes locais.

### 4. Acessar no navegador
- **Professores:** http://localhost:3000
- **Secretaria:** http://localhost:3000/secretaria.html

---

## PARTE 3 — Publicar no Render

1. Suba o projeto para um repositório no GitHub
   - **Não inclua** o arquivo `.env` (adicione `.env` no `.gitignore`)
   - **Não inclua** a pasta `node_modules`

2. Acesse https://render.com, crie conta e clique em **New > Web Service**

3. Conecte o repositório do GitHub

4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

5. Ainda no Render, vá em **Environment > Add Environment Variable**:
   - **Key:** `DATABASE_URL`
   - **Value:** (cole a string de conexão do Supabase)

6. Clique em **Deploy** — o Render gera um link público permanente

---

## Resumo do fluxo em produção

```
Professores/Secretaria
        ↓  (link público)
   Render.com
   (servidor Node.js)
        ↓  (DATABASE_URL)
   Supabase
   (banco PostgreSQL — dados permanentes)
```
