# Guia de Deploy - Social Pilot

## Plataforma Recomendada: Vercel + Neon

A combinacao mais facil, rapida e gratuita para deploy do Social Pilot.

---

## Passo 1: Banco de Dados (Neon - Gratuito)

1. Acesse https://neon.tech
2. Crie uma conta (pode usar GitHub/Google)
3. Clique em **"New Project"**
4. Escolha a regiao mais proxima de voce (ex: `Sao Paulo` ou `US East`)
5. De um nome ao projeto: `social-pilot`
6. Clique em **"Create Project"**
7. Na tela de conexao, copie a **Connection String** (formato:
   `postgresql://user:password@host:port/database?sslmode=require`)
8. Guarde essa string - voce vai usar no Passo 3

---

## Passo 2: Preparar o Projeto

### 2.1 Criar Migration Inicial para PostgreSQL

Rode no terminal na pasta do projeto:

```bash
# Instalar dependencias
npm install

# Gerar Prisma Client para PostgreSQL
npx prisma generate

# Criar migration inicial
npx prisma migrate dev --name init

# (Opcional) Semear dados de teste
npx tsx prisma/seed.ts
```

> Se der erro na migration porque nao tem PostgreSQL local, nao tem problema.
> A migration sera aplicada automaticamente na Vercel durante o build.

### 2.2 Commitar as Migrations

```bash
git add prisma/migrations
git commit -m "chore: add initial postgres migration"
```

---

## Passo 3: Deploy na Vercel (3 Opcoes)

### Opcao A - Deploy pelo Git (Recomendado)

1. Crie um repositorio no GitHub/GitLab/Bitbucket
2. Envie o codigo:
   ```bash
   git remote add origin https://github.com/seu-usuario/social-pilot.git
   git branch -M main
   git push -u origin main
   ```
3. Acesse https://vercel.com
4. Clique em **"Add New Project"**
5. Importe o repositorio do GitHub
6. Em **"Environment Variables"**, adicione:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://...` (copiou do Neon) |
| `AUTH_SECRET` | `openssl rand -base64 32` (gerar no terminal) |
| `NEXT_PUBLIC_APP_URL` | `https://seu-dominio.vercel.app` |

7. Clique em **"Deploy"**

### Opcao B - Deploy pelo CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Durante o deploy, voce sera perguntado sobre as env vars.
# Pode tambem configurar depois no dashboard da Vercel.
```

### Opcao C - Deploy Local (Mais Rapido)

```bash
npx vercel --prod
```

---

## Passo 4: Configurar Variaveis de Ambiente

Apos o primeiro deploy, va no Dashboard da Vercel:

1. Selecione o projeto
2. Va em **Settings > Environment Variables**
3. Adicione todas as variaveis necessarias:

### Obrigatorias
- `DATABASE_URL` — Connection string do Neon
- `AUTH_SECRET` — Chave secreta para JWT (min 32 chars)

### Opcionais (para funcionalidades extras)
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` — Para login com Google OAuth 2.0
- `GOOGLE_AI_API_KEY` — Para geracao de posts com IA real (Google Gemini, gratuito)
- `META_APP_ID` e `META_APP_SECRET` — Para publicar no Instagram/Facebook
- `LINKEDIN_CLIENT_ID` e `LINKEDIN_CLIENT_SECRET` — Para publicar no LinkedIn
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` — Para WhatsApp real
- `RESEND_API_KEY`, `FROM_EMAIL` — Para email real

4. Clique em **Save**
5. Va em **Deployments** e clique em **"Redeploy"** no ultimo deploy

---

## Passo 5: Rodar Migrations no Banco de Producao

Apos o deploy, voce precisa criar as tabelas no banco Neon:

**Opcao 1 - Automatica (Recomendada)**

O script `vercel-build` no `package.json` ja roda `prisma migrate deploy` antes do build.
Se configurou corretamente, as tabelas serao criadas automaticamente no primeiro deploy.

**Opcao 2 - Manual**

Se quiser rodar manualmente:

```bash
# Usando a connection string do Neon
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Ou use o **SQL Editor** do Neon para rodar o SQL gerado em `prisma/migrations/*/migration.sql`

---

## Passo 6: Popular Dados de Teste (Opcional)

Para ter dados iniciais no banco de producao:

```bash
# Rodar seed com a connection string do Neon
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

Ou conecte-se ao Neon via SQL Editor e rode INSERTs manualmente.

---

## Passo 7: Acessar o App

Seu app estara disponivel em:
- `https://seu-projeto.vercel.app`

**Login padrao (se rodou o seed):**
- Email: `admin@socialpilot.com`
- Senha: `admin123`

---

## Solucao de Problemas

### Erro: "Database does not exist"
- Verifique se a `DATABASE_URL` esta correta
- Certifique-se de que a migration foi aplicada (`npx prisma migrate deploy`)

### Erro: "PrismaClientInitializationError"
- Verifique se `DATABASE_URL` esta configurada na Vercel
- Certifique-se de que a URL inclui `?sslmode=require` para Neon

### Erro: "Module not found"
- Certifique-se de que `npm install` rodou corretamente
- Verifique se `postinstall` esta no `package.json`

### Build muito lento
- A Vercel pode demorar no primeiro build por causa do `prisma generate`
- Builds subsequentes serao mais rapidos

---

## Proximos Passos

1. **Configurar Dominio Proprio**
   - Va em Settings > Domains na Vercel
   - Adicione seu dominio e siga as instrucoes de DNS

2. **Configurar Analytics**
   - Vercel Analytics vem gratis
   - Va em Analytics no dashboard da Vercel

3. **Monitorar Logs**
   - Va em Logs no dashboard da Vercel
   - Veja erros e performance em tempo real

4. **Configurar Cron Job para Publicacao Automatica**
   - A API `/api/scheduler/publish` verifica posts para publicar
   - Use um servico como https://cron-job.org (gratuito)
   - Configure para chamar `https://seu-app.vercel.app/api/scheduler/publish` a cada 5 minutos

---

## Custos

| Servico | Tier Gratuito | O que Inclui |
|---------|---------------|--------------|
| **Vercel** | Hobby | Deploys ilimitados, banda, SSL gratis |
| **Neon** | Free Tier | 500 MB storage, 190h compute/mes |
| **OpenAI** | Pay-as-you-go | ~$0.002 por geracao de post |
| **Meta APIs** | Free | Publicacao basica |
| **Twilio** | Trial | Testes limitados |
| **Resend** | Free | 100 emails/dia |

Para um uso inicial/demo, voce nao paga **nada**.

---

## Checklist Final

- [ ] Conta Neon criada com projeto e banco
- [ ] Connection string copiada
- [ ] Projeto deployado na Vercel
- [ ] Variaveis de ambiente configuradas
- [ ] Migrations aplicadas no banco
- [ ] Seed rodado (opcional)
- [ ] Login testado no app
- [ ] Cron job configurado (opcional)
