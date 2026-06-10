# Retention — MVP de Retenção de Alunos

Plataforma para escolas/academias reduzirem churn (cancelamento) de alunos.
Calcula o **risco de evasão** de cada aluno, dispara mensagens de retenção
personalizadas por **WhatsApp** com ajuda de **IA**, e mede a **receita preservada**
pelas recuperações.

## Funcionalidades do MVP

- **Autenticação** — login com e-mail/senha (JWT + bcrypt).
- **Alunos** — cadastro, edição, exclusão, registro de frequência/atividade.
- **IA de retenção** — score de risco de churn (0–100) por aluno e geração de
  mensagens personalizadas. Funciona offline por **regras**; usa **Claude** quando configurado.
- **WhatsApp** — envio real via **Twilio**, log de mensagens e webhook de status/recebimento.
- **Dashboard de receita preservada** — MRR ativo, receita em risco, receita perdida
  e, principalmente, **receita preservada** (mensalidades de alunos recuperados via intervenção).

## Como rodar

Requisitos: Node.js 22.5+ (usa o SQLite nativo `node:sqlite`, sem dependências compiladas).

```bash
npm install
copy .env.example .env   # (Windows)  |  cp .env.example .env (Linux/Mac)
npm start
```

Acesse http://localhost:3000

Login padrão (criado no primeiro start): **admin@retention.local** / **admin123**
Na primeira execução o banco é populado com 12 alunos de demonstração (controle pela
variável `SEED_DEMO`).

## Ativar WhatsApp e IA reais

Os dois recursos funcionam em modo simulado/regras até você preencher as chaves no `.env`.
O cabeçalho do app mostra os selos **WhatsApp on/off** e **IA on/off**.

### WhatsApp (Twilio)
1. Crie uma conta em https://console.twilio.com
2. Para testes, ative o **Sandbox do WhatsApp** (Messaging → Try it out → WhatsApp).
3. Preencha no `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxx
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
4. (Opcional) Configure o webhook da Twilio para `https://SEU_HOST/api/whatsapp/webhook`
   para receber status de entrega e respostas dos alunos.

### IA (Claude / Anthropic)
1. Gere uma chave em https://console.anthropic.com
2. Preencha no `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxx
   ANTHROPIC_MODEL=claude-sonnet-4-6
   ```

Reinicie o servidor após editar o `.env`.

## Como funciona a "receita preservada"

1. A IA/regras avaliam o risco de cada aluno (botão **Avaliar risco de todos** ou por aluno).
2. Ao enviar um WhatsApp para um aluno em risco (médio/alto), o sistema cria uma
   **intervenção** (`pending`) com a mensalidade do aluno e o move para *Em risco*.
3. No dashboard, marque a intervenção como **Recuperado** ou **Perdido**.
4. As intervenções **Recuperado** somam a **receita preservada** (mensal e anualizada).

## Stack

- **Backend:** Node.js + Express
- **Banco:** SQLite via `node:sqlite` (arquivo em `data/retention.db`)
- **Auth:** JWT + bcryptjs
- **WhatsApp:** Twilio SDK
- **IA:** Anthropic SDK (Claude), com fallback por regras
- **Frontend:** SPA em HTML/CSS/JS puro (sem build), servida pelo Express

## Estrutura

```
server.js                 # entrada: monta o Express e sobe o servidor
src/
  config.js               # carrega .env e expõe configuração
  db.js                   # conexão SQLite + schema
  auth.js                 # hashing, JWT e middleware requireAuth
  seed.js                 # admin inicial + alunos de demonstração
  services/
    risk.js               # motor de risco por regras (offline)
    ai.js                 # análise + mensagens via Claude (com fallback)
    whatsapp.js           # adaptador de envio Twilio
  routes/
    auth.js               # /api/auth (register, login, me)
    students.js           # /api/students (CRUD + atividade)
    retention.js          # /api/retention (assess, message, scan)
    whatsapp.js           # /api/whatsapp (send, webhook)
    dashboard.js          # /api/dashboard (métricas + desfecho de intervenção)
public/                   # frontend (index.html, app.js, styles.css)
```

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login, retorna JWT |
| GET  | `/api/students` | Lista alunos com risco |
| POST | `/api/students` | Cria aluno |
| POST | `/api/students/:id/activity` | Registra frequência |
| POST | `/api/retention/students/:id/assess` | Avalia risco (regras+IA) |
| POST | `/api/retention/students/:id/message` | Gera mensagem de retenção |
| POST | `/api/retention/scan` | Avalia todos os alunos |
| POST | `/api/whatsapp/students/:id/send` | Envia WhatsApp + cria intervenção |
| GET  | `/api/dashboard` | Métricas de receita preservada |
| POST | `/api/dashboard/interventions/:id/outcome` | Marca recuperado/perdido |

> Todas as rotas (exceto `/api/auth/*`, `/api/health` e o webhook) exigem `Authorization: Bearer <token>`.
