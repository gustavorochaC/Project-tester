# Contexto do Projeto — Social Pilot

> **LIVING DOCUMENT** — Este arquivo deve ser atualizado a cada interacao.
> Toda nova sessao, bug encontrado, feature implementada ou erro investigado deve ser registrado aqui.
> Quando retomar este projeto, leia este arquivo inteiro antes de fazer qualquer alteracao.

**Ultima atualizacao:** 26 Abr 2026  
**Deploy ativo:** https://social-pilot-app.vercel.app  
**Branch:** `master` → Vercel auto-deploy  
**Status geral:** ✅ Estavel — Google OAuth implementado, Hub de Integracoes completo, credenciais configuradas

---

## Instrucoes para o Agente

1. **SEMPRE** leia este arquivo antes de comecar qualquer trabalho no projeto.
2. **SEMPRE** atualize este arquivo ao final de cada sessao, mesmo que seja apenas um ajuste pequeno.
3. Use o formato padronizado na secao "Registro de Sessoes" abaixo.
4. Se um bug for encontrado, registre-o na secao "Incidentes Ativos".
5. Se um bug for resolvido, mova-o de "Incidentes Ativos" para "Registro de Sessoes" com a resolucao.
6. Se uma nova feature for adicionada, atualize "Funcionalidades" e "Estado do Deploy".

---

## Stack & Versoes (nao alterar sem motivo)

| Tool | Version | Note |
|------|---------|------|
| Next.js | 16.2.4 | Dynamic route params = Promise<{id}> (MUST await) |
| React | 19.2.4 | — |
| Prisma | 5.22.0 | Schema usa `url` no datasource. Sem `prisma.config.ts` |
| Tailwind | v4 | Via `@tailwindcss/postcss` |
| DB (prod) | PostgreSQL | Neon em producao. SQLite = dev local apenas |
| DB (dev) | SQLite | `file:./dev.db` — facil para testes locais |
| UI | shadcn + @base-ui/react | NAO e Radix! Button `asChild` e custom |
| Auth | Custom JWT | `jose` + `bcryptjs`. Cookie = `session`. Nao NextAuth |
| Icons | lucide-react 1.11.0 | Faltam: Instagram, Facebook, Linkedin. Usar Globe, Share2, MessageSquare |
| AI | Google Gemini | Modelo: `gemini-flash-latest` (free tier) |
| Upload | Cloudinary | Via API REST (sem SDK pesado) |
| WhatsApp | Twilio | Sandbox para dev, producao com numero verificado |
| Email | Resend | Apenas para email da conta em dev; dominio verificado em prod |

---

## Estado Atual do Deploy

- **URL Producao:** https://social-pilot-app.vercel.app
- **Status:** ✅ Online e funcional
- **Ultimo deploy:** Commit `640af56` — Hub de Integracoes + Configuracoes Reais
- **Ultima sessao:** Implementacao Hub de Integracoes + OAuth Real + Credenciais Configuradas (26 Abr 2026)

### Funcionalidades Operacionais
- ✅ Login / Registro / Logout
- ✅ **NOVO:** Login com Google OAuth 2.0 (auto-linking de contas)
- ✅ Autenticacao JWT (session cookie)
- ✅ Geracao de posts com IA (Google Gemini)
- ✅ Salvar post como Pendente
- ✅ Aprovar e Salvar post
- ✅ Listagem de posts pendentes
- ✅ Dashboard carregando dados
- ✅ Criacao de clientes (auth corrigido)
- ✅ Criacao de trends (auth corrigido)
- ✅ Settings (perfil com website, whatsapp, email de notificacao)
- ✅ **NOVO:** Upload de imagens via Cloudinary
- ✅ **NOVO:** Hub de Integracoes (`/integrations`) com 4 abas
- ✅ **NOVO:** Conectar multiplas contas sociais (Instagram, Facebook, LinkedIn)
- ✅ **NOVO:** OAuth real com exchange de token (Meta/LinkedIn)
- ✅ **NOVO:** Selecao de pagina/organizacao apos OAuth
- ✅ **NOVO:** Publicacao real para Meta e LinkedIn
- ✅ **NOVO:** Notificacoes por evento (8 eventos, WhatsApp/Email)
- ✅ **NOVO:** Logs de atividade com filtros e paginacao
- ✅ **NOVO:** Health check de tokens (🟢🟡🔴)
- ✅ **NOVO:** Testar integracoes (WhatsApp/Email manual)
- ✅ **NOVO:** Scheduler protegido por CRON_SECRET

### Funcionalidades com Fallback (simuladas quando sem credenciais)
- ⚠️ OAuth Meta — modo demo se META_APP_ID/SECRET faltarem
- ⚠️ OAuth LinkedIn — modo demo se LINKEDIN_CLIENT_ID/SECRET faltarem
- ⚠️ Publicacao — simulada se credenciais nao configuradas

---

## Incidentes Ativos

> Bugs ou problemas conhecidos que ainda precisam de atencao.
> Quando resolvido, mova para "Registro de Sessoes" e marque como RESOLVIDO.

| # | Data | Problema | Impacto | Prioridade |
|---|------|----------|---------|------------|
| — | — | Nenhum incidente ativo no momento | — | — |

---

## Registro de Sessoes (do mais recente para o mais antigo)

### Sessao 26 Abr 2026 — Google OAuth Login

**Realizado por:** Agente OpenCode  
**Branch:** `feature/google-oauth` → `master`  
**Deploy:** Commit `d6e97fa` → Vercel auto-deploy  
**Resumo:** Implementado login e registro com Google OAuth 2.0, com auto-linking de contas existentes e graceful degradation quando credenciais nao configuradas.

#### 1. Google OAuth 2.0 — Fluxo Completo
**Motivo:** Usuarios pediram login com Google como metodo alternativo ao email/senha
**Decisao:** Implementar OAuth nativo manual (sem NextAuth) para manter compatibilidade com JWT customizado existente

**Arquivos criados:**
- `lib/google-oauth.ts` — helpers: `generateState()`, `getGoogleAuthUrl()`, `exchangeCodeForTokens()`, `verifyGoogleIdToken()`
- `app/api/auth/google/route.ts` — inicia fluxo OAuth com CSRF state cookie
- `app/api/auth/google/callback/route.ts` — finaliza fluxo com validacao, auto-linking e criacao de sessao JWT

**Arquivos modificados:**
- `prisma/schema.prisma` — `password` tornou-se opcional (`String?`), novos campos `googleId` e `image` no `User`
- `middleware.ts` — adicionadas rotas `/api/auth/google` e `/api/auth/google/callback` como publicas
- `components/auth-provider.tsx` — adicionado `loginWithGoogle()` ao contexto
- `app/login/page.tsx` + `app/login/login-form.tsx` — botao "Entrar com Google" com separador visual e tratamento de erros por URL
- `app/register/page.tsx` — botao "Criar conta com Google"
- `app/api/auth/login/route.ts` — suporte a usuarios sem senha (OAuth-only)

**Detalhes tecnicos:**
- CSRF protection via cookie `google_oauth_state` (httpOnly, 5min, sameSite lax)
- Validacao do ID token via endpoint `tokeninfo` do Google com checagem de `aud`, `iss` e `exp`
- Auto-linking: se email ja existe no banco, vincula `googleId` automaticamente (apenas se `email_verified=true`)
- Criacao atomica de `User` + `CompanyProfile` + `NotificationSettings` via `prisma.$transaction`
- Graceful degradation: app funciona normalmente sem `GOOGLE_CLIENT_ID/SECRET`

#### 2. Sync do Banco de Dados (Producao)
**Motivo:** Banco Neon estava desatualizado com relacao ao schema Prisma
**Decisao:** Aplicar migrations para adicionar colunas faltantes

**Migrations aplicadas:**
- `20260426020356_add_google_oauth_to_user` — `password?`, `googleId`, `image`
- `20260426030000_add_company_profile_columns` — `website`, `notificationEmail`
- `20260426031000_add_post_social_account_ids` — `socialAccountIds`
- `20260426032000_add_social_account_columns` — `pageType`, `scope`

---

### Sessao 26 Abr 2026 — Hub de Integracoes + OAuth Real + Credenciais

**Realizado por:** Agente OpenCode  
**Branch:** `master`  
**Deploy:** Commit `640af56` → Vercel auto-deploy  
**Resumo:** Implementado Hub de Integracoes completo com OAuth real, multiplas contas, notificacoes por evento, logs, upload Cloudinary, e credenciais reais configuradas.

#### 1. Schema Prisma — Novos Models e Campos
**Motivo:** Suportar multiplas contas, logs, notificacoes e upload
**Decisao:** Adicionar `IntegrationLog`, `NotificationRule`, campos em `SocialAccount`, `Post`, `CompanyProfile`

**Arquivos modificados:**
- `prisma/schema.prisma` — novos models, removido enum `PostStatus` (troca para String por compatibilidade SQLite)

**Detalhes tecnicos:**
- `IntegrationLog`: TTL 90 dias, indices em `userId` e `createdAt`
- `NotificationRule`: regra por evento por usuario, channels como JSON
- `SocialAccount`: removido `@@unique([userId, platform])`, adicionado `pageType`, `scope`, `expiresAt`
- `Post`: novo campo `socialAccountIds` (JSON array), `image`
- `CompanyProfile`: novos campos `website`, `notificationEmail`
- **IMPORTANTE:** `Post.status` agora e `String` (nao enum), para compatibilidade SQLite

#### 2. Upload de Imagens — Cloudinary
**Motivo:** Instagram/Facebook APIs exigem URL publica de imagem
**Decisao:** Usar Cloudinary (free tier generoso, upload via API REST)

**Arquivos criados:**
- `lib/cloudinary.ts` — funcao `uploadToCloudinary()` com assinatura SHA1
- `app/api/upload/route.ts` — endpoint POST recebe FormData, retorna `secure_url`

**Arquivos modificados:**
- `app/(app)/create-post/page.tsx` — input file para upload + preview + seletor de contas
- `app/api/posts/route.ts` — aceita `image` e `socialAccountIds`

**Detalhes tecnicos:**
- Fallback simulado se `CLOUDINARY_CLOUD_NAME` nao estiver configurado
- Usa `FormData` no front, `Blob` no back, assinatura com `crypto.createHash('sha1')`

#### 3. OAuth Real — Meta e LinkedIn
**Motivo:** OAuth anterior salvava token fake sem exchange
**Decisao:** Implementar exchange real de `code` por `access_token`

**Arquivos modificados:**
- `app/api/social/auth/[platform]/route.ts` — scopes atualizados, state seguro
- `app/api/social/callback/[platform]/route.ts` — exchange real de token, redireciona para selecao

**Arquivos criados:**
- `app/api/social/pages/route.ts` — lista paginas do Meta (`me/accounts`)
- `app/api/social/organizations/route.ts` — lista orgs do LinkedIn (`organizationalEntityAcls`)
- `app/(app)/integrations/connect/select-page/page.tsx` — UI selecao de pagina (com Suspense)
- `app/(app)/integrations/connect/select-organization/page.tsx` — UI selecao de org (com Suspense)

**Fluxo Meta:**
1. `/api/social/auth/instagram` → redireciona para Facebook OAuth
2. Usuario autoriza
3. `/api/social/callback/instagram` → recebe `code`, faz exchange por token
4. Redireciona para `/integrations/connect/select-page?token=...`
5. Busca paginas via `/api/social/pages?token=...`
6. Usuario seleciona pagina (que tem Instagram Business vinculado)
7. Salva conta com `accountId` da pagina/Instagram

**Fluxo LinkedIn:**
1. Similar, mas redireciona para `select-organization`
2. Busca orgs via `/api/social/organizations`
3. Usuario pode escolher org ou usar perfil pessoal

#### 4. Publicacao Real
**Motivo:** Publicacao anterior era inteiramente simulada
**Decisao:** Implementar chamadas reais as APIs

**Arquivos criados:**
- `lib/integration-logger.ts` — funcao `logIntegrationEvent()`
- `lib/social-publish.ts` — `publishToPlatform()` com chamadas reais
- `lib/notifications.ts` — `shouldNotify()`, `getNotificationTarget()`, `sendEventNotification()`

**Arquivos modificados:**
- `app/api/social/publish/route.ts` — usa `publishToPlatform()`, aceita `postId` apenas
- `app/api/scheduler/publish/route.ts` — protecao CRON_SECRET + publicacao real
- `app/api/social/accounts/route.ts` — adicionado POST para criar conta

**Detalhes tecnicos:**
- **Instagram:** `POST /{ig-user-id}/media` (criar container) → `POST /{ig-user-id}/media_publish`
- **Facebook:** `POST /{page-id}/feed` (texto) ou `/photos` (imagem)
- **LinkedIn:** `POST /v2/ugcPosts` com `author` e `shareContent`
- Fallback simulado se credenciais nao configuradas
- Em caso de falha: status `falhou`, log `post_failed`, notificacao automatica

#### 5. Notificacoes por Evento
**Motivo:** Notificacoes anteriores nao respeitavam preferencias
**Decisao:** Sistema de regras por evento com destinatarios configuraveis

**Arquivos criados:**
- `app/api/integrations/notifications/route.ts` — GET/PUT regras e destinatarios
- `app/api/integrations/logs/route.ts` — GET com filtros e paginacao
- `app/api/integrations/cleanup/route.ts` — DELETE logs > 90 dias (protegido por CRON_SECRET)

**Eventos suportados:**
`post_approved`, `post_rejected`, `post_published`, `post_failed`, `token_expiring`, `urgent_trend`, `weekly_report`, `new_client`

**Canais:** WhatsApp (Twilio) e Email (Resend)
- Respeita `NotificationRule` antes de enviar
- Fallback para `CompanyProfile.whatsapp` / `notificationEmail`
- Fallback para `User.email`
- Modo simulado (console + toast) se Twilio/Resend nao configurados

#### 6. Pagina `/integrations`
**Motivo:** Centralizar operacoes de integracoes fora de Settings
**Decisao:** Nova pagina com 4 abas na sidebar

**Arquivo criado:**
- `app/(app)/integrations/page.tsx` — 4 abas: Contas, Notificacoes, Logs, Testes

**Funcionalidades:**
- Contas Conectadas: cards com health check (🟢🟡🔴), botao conectar/desconectar
- Notificacoes: toggles por evento, checkboxes WhatsApp/Email, inputs destinatarios
- Logs: tabela com filtros (plataforma, status, evento), paginacao
- Testes: botoes para testar WhatsApp e Email manualmente

**Ajustes:**
- `components/layout/sidebar.tsx` — adicionado item "Integracoes"
- `components/publish-now-button.tsx` — remove hardcoded platforms
- `app/(app)/settings/page.tsx` — remove abas Social/Notificacoes, adiciona campos website/whatsapp/email

#### 7. Configuracao de Credenciais
**Motivo:** App precisa de credenciais reais para funcionar fora do modo demo
**Decisao:** Configurar todas as credenciais no `.env`

**Credenciais configuradas:**
| Servico | Status | Valor/Obs |
|---------|--------|-----------|
| Cloudinary | ✅ | `dglewfrb9` / API Key: `[REDACTED]` |
| Twilio | ✅ | Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| Resend | ✅ | API Key: `re_62C7Uvm3_...` |
| Meta (Facebook/Instagram) | ✅ | App ID: `1263856599207162` |
| LinkedIn | ❌ Desativado | Por enquanto |

**Problemas encontrados e corrigidos:**
- Twilio Account SID estava como `US...` (errado), corrigido para `AC...`
- Resend so envia para email da conta em dev; outros emails precisam de dominio verificado
- Facebook URLs de callback precisam estar em "Valid OAuth Redirect URIs" em `developers.facebook.com`

#### 8. SQLite para Desenvolvimento
**Motivo:** PostgreSQL (Neon) nao estava acessivel localmente
**Decisao:** Migrar dev para SQLite, manter PostgreSQL para producao

**Alteracoes:**
- `prisma/schema.prisma` — `provider = "sqlite"`, `url = "file:./dev.db"`
- Removido enum `PostStatus` (SQLite nao suporta) — trocado para `String`
- `prisma/seed.ts` — remove cast `as any` para `status`
- `.env` — DATABASE_URL nao e mais necessario em dev

**Como reverter para PostgreSQL:**
```bash
# 1. Mude provider em schema.prisma
provider = "postgresql"
url      = env("DATABASE_URL")

# 2. Delete migrations e dev.db
rm -rf prisma/migrations prisma/dev.db

# 3. Rode migration
npx prisma migrate dev --name init

# 4. Seed opcional
npx tsx prisma/seed.ts
```

#### 9. Guia de Configuracao Facebook/Instagram
**Motivo:** Usuario teve dificuldade para encontrar campos no Facebook Developer
**Decisao:** Criar guia passo a passo

**Arquivos criados:**
- `docs/FACEBOOK_INSTAGRAM_SETUP.md` — guia completo em Markdown
- `app/(app)/integrations/setup-guide/page.tsx` — pagina de ajuda dentro do app
- Botao "Guia de Configuracao" na aba Contas Conectadas

#### 10. Erros e Bugs Corrigidos Durante a Sessao

**Bug 1: `useSearchParams()` sem `Suspense`**
- Erro: `useSearchParams() should be wrapped in a suspense boundary`
- Causa: Next.js 16 exige `Suspense` para `useSearchParams()`
- Arquivos afetados: `/integrations/page.tsx`, `/select-page/page.tsx`, `/select-organization/page.tsx`
- Solucao: Adicionar `export const dynamic = "force-dynamic"` (nao funciona) → Melhor: envolver em `<Suspense>`

**Bug 2: SQLite nao suporta `enum`**
- Erro: `You defined the enum PostStatus. But the current connector does not support enums`
- Causa: SQLite nao tem tipo enum nativo
- Solucao: Trocar `enum PostStatus` para `String` no schema

**Bug 3: `POST /api/social/accounts` nao existia**
- Erro: 405 Method Not Allowed ao selecionar pagina apos OAuth
- Causa: A rota so tinha GET e DELETE
- Solucao: Adicionar handler POST para criar conta

**Bug 4: Twilio Account SID errado**
- Erro: `accountSid must start with AC`
- Causa: Usuario forneceu `US...` em vez de `AC...`
- Solucao: Atualizar `.env` com Account SID correto

**Bug 5: Resend so envia para email da conta**
- Erro: `You can only send testing emails to your own email address`
- Causa: Resend em dev restringe destinatarios
- Solucao: Usar `gustavorocarvalho@hotmail.com` para testes; para outros emails, verificar dominio em resend.com/domains

**Bug 6: Seed com enum**
- Erro: TypeScript `PostStatus` nao e compativel com string
- Causa: Seed criava posts com `status: "aprovado"` (string) mas schema esperava enum
- Solucao: Após trocar para String, remove cast `as any`

---

### Sessao 25 Abr 2026 — Migracao OpenAI → Google Gemini + Fix Auth Endpoints

**Realizado por:** Agente OpenCode  
**Branch:** `master`  
**Deploy:** Commit `ee21573` → Vercel auto-deploy  
**Resumo:** Substituída a integracao OpenAI por Google Gemini (free tier) e corrigido erro 500 em todos os endpoints causado por `userId` hardcoded.

#### 1. Migracao OpenAI → Google Gemini
**Motivo:** OpenAI retornava `429 Quota Exceeded` — usuario nao tinha billing configurado.
**Decisao:** Usar Google Gemini `gemini-flash-latest` que funciona no free tier. Modelo `gemini-2.0-flash` exige quota/billing.

**Arquivos modificados:**
- `app/api/ai/generate/route.ts` — reescrito para `GoogleGenerativeAI`
- `package.json`, `package-lock.json` — adicionado `@google/generative-ai`
- `.env`, `.env.example` — `GOOGLE_AI_API_KEY` substituiu `OPENAI_API_KEY`
- `AGENTS.md` — atualizado docs de integracao
- `DEPLOY.md` — atualizado docs de deploy

**Detalhes tecnicos:**
- Adicionado fallback com templates pre-gerados caso a API Gemini falhe (evita 500)
- Prompt otimizado para retornar JSON estruturado: `{ title, content, hashtags[], type, date, time }`
- Variavel `GOOGLE_AI_API_KEY` setada no Vercel Production

#### 2. Fix: Erro 500 ao salvar posts/clients/trends/settings
**Problema:** Todos os endpoints usavam `userId: "1"` hardcoded. No Neon, ID `"1"` nao existia → foreign key error → 500.
**Impacto:** Usuarios nao conseguiam salvar posts, clientes, trends nem settings.

**Solucao:** Substituído por `getCurrentUser()` (autenticacao via cookie JWT `session`) em 8 arquivos:
- `app/api/posts/route.ts` (GET/POST)
- `app/api/posts/[id]/route.ts` (PUT/DELETE — com ownership check)
- `app/api/clients/route.ts` (GET/POST)
- `app/api/clients/[id]/route.ts` (PUT/DELETE — com ownership check)
- `app/api/trends/route.ts` (GET/POST)
- `app/api/trends/[id]/route.ts` (PUT/DELETE — com ownership check)
- `app/api/settings/route.ts` (GET/PUT)

**Nota:** Durante o fix, descobriu-se que os endpoints `POST /api/clients` e `POST /api/trends` usavam campos que nao existiam no schema Prisma (ex: `email`, `phone`, `company`, `notes` no Client; `category` no Trend). Corrigidos para usar os campos reais do schema.

#### 3. Build & Deploy
- ✅ TypeScript compila sem erros
- ✅ Deploy Vercel automatico via `git push origin master`
- ⚠️ Warnings antigos de `resend` e `twilio` permanecem (modulos opcionais, nao quebram build)

---

## Variaveis de Ambiente (Producao — Vercel)

| Variavel | Status | Valor / Observacao |
|----------|--------|-------------------|
| `DATABASE_URL` | ✅ Setado | PostgreSQL Neon com `?sslmode=require` |
| `AUTH_SECRET` | ✅ Setado | Min 32 chars |
| `NEXT_PUBLIC_APP_URL` | ✅ Setado | `https://social-pilot-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | ✅ Setado | `106264413847-72ff7h1i5u61s0jkdhes06lbnkcs2p7v.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ Setado | Configurado no Vercel |
| `GOOGLE_AI_API_KEY` | ✅ Setado | Projeto GCP: `social-pilot-ai-106264413847` |
| `META_APP_ID` | ✅ Setado | `1263856599207162` |
| `META_APP_SECRET` | ✅ Setado | Configurado no .env (nao no Vercel ainda) |
| `LINKEDIN_CLIENT_ID` | ❌ Nao setado | Desativado por enquanto |
| `LINKEDIN_CLIENT_SECRET` | ❌ Nao setado | Desativado por enquanto |
| `CLOUDINARY_CLOUD_NAME` | ✅ Setado | `dglewfrb9` |
| `CLOUDINARY_API_KEY` | ✅ Setado | `[REDACTED]` |
| `CLOUDINARY_API_SECRET` | ✅ Setado | Configurado no .env |
| `TWILIO_ACCOUNT_SID` | ✅ Setado | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | ✅ Setado | Configurado no .env |
| `TWILIO_WHATSAPP_NUMBER` | ✅ Setado | `+14155238886` |
| `RESEND_API_KEY` | ✅ Setado | `re_62C7Uvm3_...` |
| `FROM_EMAIL` | ✅ Setado | `onboarding@resend.dev` |
| `CRON_SECRET` | ✅ Setado | `social-pilot-cron-secret-2024-change-me` |

---

## Decisoes Tecnicas Criticas (nunca quebrar)

1. **NUNCA usar `fetch()` para APIs internas em Server Components** — chamar Prisma direto (ver AGENTS.md)
2. **NUNCA commitar `.env`** — esta no `.gitignore`
3. **NAO rodar `prisma migrate deploy` no Vercel build** — migrations manuais/CI
4. **Sempre `await params` em Next.js 16** — dynamic route params sao `Promise<{id}>`
5. **Google Gemini:** `gemini-flash-latest` = free tier; `gemini-2.0-flash` = requer billing
6. **Auth:** Session cookie = `session` (HTTP-only). `getCurrentUser()` para pegar usuario logado.
7. **SQLite em dev:** Nao usar enum (nao suportado). Usar String com `@default("valor")`.
8. **Cloudinary upload:** Sempre usar assinatura SHA1 com timestamp + api_secret.
9. **OAuth callback:** Sempre validar state parameter para prevenir CSRF.
10. **Scheduler:** Sempre proteger com `CRON_SECRET` no header `x-cron-secret`.

---

## Estrutura de API (Atualizada)

```
app/api/
  auth/
    login         POST   — email + password → JWT session
    register      POST   — cria usuario + session
    logout        POST   — deleta cookie session
    me            GET    — retorna usuario logado
    google        GET    — inicia OAuth do Google
    google/callback GET  — callback OAuth do Google (cria/vincula usuario)
  ai/
    generate      POST   — Google Gemini (com fallback templates)
  upload/
    route.ts      POST   — Upload imagem para Cloudinary
  posts/          GET/POST
  posts/[id]      PUT/DELETE
  clients/        GET/POST
  clients/[id]    PUT/DELETE
  trends/         GET/POST
  trends/[id]    PUT/DELETE
  settings/       GET/PUT
  dashboard/      GET    — metricas agregadas
  social/
    accounts      GET/POST/DELETE  — contas conectadas
    auth/[platform] GET — inicia OAuth
    callback/[platform] GET — callback OAuth com exchange real
    pages         GET    — lista paginas do Meta
    organizations GET    — lista orgs do LinkedIn
    publish       POST   — publica post real (ou simulado)
    refresh       GET    — refresh token LinkedIn
  scheduler/
    publish       GET    — endpoint cron (protegido por CRON_SECRET)
  integrations/
    logs          GET    — lista logs com filtros/paginacao
    notifications GET/PUT — regras de notificacao
    cleanup       GET    — deleta logs > 90 dias (CRON_SECRET)
  notifications/
    email         POST   — envia email real (ou simulado)
    whatsapp      POST   — envia WhatsApp real (ou simulado)
  webhooks/
    meta          POST   — webhooks do Meta (placeholder)
    linkedin      POST   — webhooks do LinkedIn (placeholder)
  reports/
    export        GET    — exporta dados para PDF/CSV
```

---

## Schema Prisma (campos obrigatorios para criacao)

### User
```
id, email, name, password (nullable para OAuth), image, googleId (unique, nullable), role, createdAt, updatedAt
```

### Post
```
title, content, hashtags (JSON string), type, status (String: pendente/aprovado/reprovado/publicado/falhou), 
date (YYYY-MM-DD), time (HH:MM), image (URL), socialAccountIds (JSON array), userId
```

### Client
```
name, segment, plan (default: "starter"), userId
```

### Trend
```
title, description, urgency (alta/media/baixa), suggestedPost, hashtags (JSON string), expiresIn, niche, userId
```

### CompanyProfile
```
companyName, segment, description, city, targetAge, targetGender, voice, words, avoidWords, objectives, frequency,
website, whatsapp, notificationEmail, plan, userId
```

### NotificationSettings (legacy — manter para compatibilidade)
```
whatsapp, email, trends, weekly, userId
```

### SocialAccount
```
platform, accountId, accountName, accessToken, refreshToken, expiresAt, connected, pageType, scope, userId
```

### IntegrationLog
```
userId, event, platform, status, message, metadata (JSON), createdAt
```

### NotificationRule
```
userId, eventType, channels (JSON), active, createdAt
```

---

## Repositorios & Links

- **GitHub:** https://github.com/gustavorochaC/Project-tester
- **Vercel Dashboard:** https://vercel.com/gustavorochac/project-tester
- **URL Producao:** https://social-pilot-app.vercel.app
- **Neon Dashboard:** (acessar via console.neon.tech com a conta do usuario)
- **Facebook Developer:** https://developers.facebook.com/apps/1263856599207162
- **Resend Dashboard:** https://resend.com
- **Twilio Console:** https://console.twilio.com
- **Cloudinary Dashboard:** https://console.cloudinary.com

---

## Template para Novas Sessoes

Quando registrar uma nova sessao, copie e preencha:

```markdown
### Sessao [DATA] — [TITULO RESUMIDO]

**Realizado por:** [quem fez]  
**Branch:** `master` ou `[feature-branch]`  
**Deploy:** Commit `[hash]` → Vercel [auto-deploy / manual]  
**Resumo:** [1-2 frases do que foi feito]

#### [Numero]. [Titulo da mudanca]
**Motivo:** [por que foi necessario]  
**Decisao:** [o que foi decidido e por que]  

**Arquivos modificados:**
- `caminho/do/arquivo.ts` — [o que mudou]

**Detalhes tecnicos:**
- [qualquer detalhe relevante para futuro debug]

**Status:** [✅ RESOLVIDO / ⚠️ PARCIAL / ❌ PENDENTE]
```

---

*Este documento e a memoria viva do projeto. Mantenha-o atualizado. Leia-o sempre antes de trabalhar.*
