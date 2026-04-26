# Erros Comuns & Solucoes — Social Pilot

> **LIVING DOCUMENT** — Registro de todos os erros encontrados durante o desenvolvimento.
> Quando um erro novo aparecer, documente aqui com: causa, sintoma, solucao, e prevencao.

**Ultima atualizacao:** 26 Abr 2026

---

## Indice

| # | Erro | Onde ocorre | Categoria |
|---|------|-------------|-----------|
| 1 | `useSearchParams()` sem Suspense | Next.js build | Runtime |
| 2 | SQLite nao suporta `enum` | Prisma migration | Database |
| 3 | `POST /api/social/accounts` nao existe | OAuth callback | API |
| 4 | Twilio Account SID errado | WhatsApp envio | Integracao |
| 5 | Resend so envia para email da conta | Email envio | Integracao |
| 6 | Seed com enum nao compativel | Prisma seed | Database |
| 7 | `DATABASE_URL` invalido (placeholder) | Prisma client | Database |
| 8 | Prisma generate travado (EPERM) | Prisma generate | Windows |
| 9 | Facebook App Secret comentado no .env | OAuth | Configuracao |
| 10 | `socialAccountIds` nao enviado ao salvar post | Criar post | API |
| 11 | `notificationEmail` nao usado como fallback | Email API | API |
| 12 | `website` enviado mas nao existe no schema | Settings | Schema |
| 13 | Scheduler publico sem protecao | Cron job | Seguranca |
| 14 | Upload sem servico de storage | Upload imagem | Integracao |
| 15 | OAuth salva token fake sem exchange | OAuth callback | Integracao |

---

## Erro 1: `useSearchParams()` deve estar dentro de `Suspense`

### Sintoma
```
⨯ Error: useSearchParams() should be wrapped in a suspense boundary at page "/integrations/connect/select-page"
```

### Causa
Next.js 16 (App Router) requer que componentes que usam `useSearchParams()` estejam dentro de um `<Suspense>` boundary. Isso acontece porque `useSearchParams()` depende de dados que so estao disponiveis no cliente.

### Arquivos Afetados
- `app/(app)/integrations/page.tsx`
- `app/(app)/integrations/connect/select-page/page.tsx`
- `app/(app)/integrations/connect/select-organization/page.tsx`

### Solucao
Adicionar `Suspense` ao redor do componente:

```tsx
// ANTES (quebra)
export default function Page() {
  const searchParams = useSearchParams(); // ❌ Erro!
  // ...
}

// DEPOIS (funciona)
export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <InnerComponent />
    </Suspense>
  );
}

function InnerComponent() {
  const searchParams = useSearchParams(); // ✅ OK!
  // ...
}
```

### Prevencao
- Sempre verificar se componentes que usam `useSearchParams()`, `usePathname()`, `useRouter()` estao dentro de `Suspense`
- Ou adicionar `export const dynamic = "force-dynamic"` (nao resolve todos os casos)

---

## Erro 2: SQLite nao suporta `enum`

### Sintoma
```
Error: You defined the enum `PostStatus`. But the current connector does not support enums.
```

### Causa
SQLite nao tem tipo de dado `enum` nativo. Prisma gera erro ao tentar criar migration com enum quando provider e SQLite.

### Contexto
O projeto originalmente usava PostgreSQL (suporta enum). Quando migramos para SQLite para desenvolvimento local, o enum `PostStatus` quebrou.

### Solucao
Trocar `enum` para `String` com `@default`:

```prisma
// ANTES (PostgreSQL)
enum PostStatus {
  pendente
  aprovado
  reprovado
  publicado
  falhou
}

model Post {
  status PostStatus @default(pendente)
}

// DEPOIS (SQLite compativel)
model Post {
  status String @default("pendente")
}
```

### Prevencao
- Ao migrar de PostgreSQL para SQLite, sempre verificar se ha enums no schema
- Alternativa: manter PostgreSQL para dev (Neon tem free tier)

---

## Erro 3: Rota `POST /api/social/accounts` nao existe

### Sintoma
```
POST /api/social/accounts 405 Method Not Allowed
```

### Causa
A API `/api/social/accounts` so tinha handlers `GET` (listar) e `DELETE` (desconectar). As paginas `select-page` e `select-organization` fazem `POST` para salvar a conta apos OAuth, mas o handler nao existia.

### Contexto
Fluxo OAuth:
1. Usuario autoriza no Facebook
2. Callback recebe token
3. Redireciona para `select-page`
4. Pagina faz `POST /api/social/accounts` para salvar
5. ❌ 405 porque POST nao existe

### Solucao
Adicionar handler `POST`:

```ts
// app/api/social/accounts/route.ts
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return 401;

  const body = await request.json();
  const account = await prisma.socialAccount.create({
    data: {
      userId: user.id,
      platform: body.platform,
      accountId: body.accountId,
      accountName: body.accountName,
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      expiresAt: body.expiresAt,
      connected: true,
    },
  });
  return Response.json(account, { status: 201 });
}
```

### Prevencao
- Sempre verificar todas as rotas chamadas pelo frontend
- Criar testes de integracao para fluxos completos

---

## Erro 4: Twilio Account SID deve comecar com `AC`

### Sintoma
```
Error: accountSid must start with AC
```

### Causa
O usuario forneceu o valor `US8c2d0c44...` (User SID) em vez de `AC80691b54...` (Account SID). Twilio exige que Account SID comecce com `AC`.

### Contexto
- **User SID** (`US...`): Identificador do usuario no console Twilio
- **Account SID** (`AC...`): Identificador da conta Twilio usado na API

### Solucao
Encontrar o Account SID correto:
1. Acesse https://console.twilio.com/
2. No dashboard principal (pagina inicial), procure:
   ```
   ACCOUNT SID
   ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Ou va em: **Account → API keys & tokens**

Atualizar `.env`:
```env
# ERRADO
TWILIO_ACCOUNT_SID=US8c2d0c44fe86635776f8caea99b3d9bb

# CERTO
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Prevencao
- Validar formato das credenciais antes de usar
- Adicionar comentario no `.env.example` explicando o formato

---

## Erro 5: Resend so envia para email da conta em dev

### Sintoma
```json
{
  "error": {
    "statusCode": 403,
    "message": "You can only send testing emails to your own email address"
  }
}
```

### Causa
Resend em modo de desenvolvimento (sem dominio verificado) so permite enviar emails para o endereco de email da conta Resend.

### Contexto
- Conta Resend: `gustavorocarvalho@hotmail.com`
- Tentativa de enviar para: `test@example.com` → erro 403
- Envio para: `gustavorocarvalho@hotmail.com` → sucesso

### Solucao
**Opcao A (Rapida):** Usar email da conta para testes
```ts
const to = profile?.notificationEmail || user.email; // fallback para email da conta
```

**Opcao B (Completa):** Verificar um dominio em https://resend.com/domains
1. Adicione seu dominio (ex: `socialpilot.com`)
2. Configure os registros DNS (SPF, DKIM, DMARC)
3. Aguarde verificacao
4. Use qualquer email desse dominio: `noreply@socialpilot.com`

### Prevencao
- Documentar essa limitacao no `.env.example`
- Adicionar fallback no codigo para usar email do usuario logado

---

## Erro 6: Seed com enum nao compativel com String

### Sintoma
```
Type error: Type '{ status: string; ... }' is not assignable to type 'PostUncheckedCreateInput'
  Types of property 'status' are incompatible.
    Type 'string' is not assignable to type 'PostStatus | undefined'
```

### Causa
O seed criava posts com `status: "aprovado"` (string), mas o schema esperava `PostStatus` (enum). Apos trocar para `String`, o cast `as any` se tornou desnecessario.

### Contexto
```ts
// ANTES (com enum)
create: {
  ...post,
  status: post.status as any, // necessario para compatibilidade enum/string
}

// DEPOIS (com String)
create: {
  ...post,
  // nao precisa mais de cast
}
```

### Solucao
Remover o cast `as any` do seed apos trocar para `String`.

### Prevencao
- Sempre atualizar o seed quando mudar tipos no schema
- Rodar `npx tsc --noEmit` apos mudancas no schema

---

## Erro 7: `DATABASE_URL` invalido (placeholder)

### Sintoma
```
PrismaClientInitializationError: The provided database string is invalid.
Error parsing connection string: invalid port number in database URL.
```

### Causa
O `.env` tinha um placeholder:
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```
Prisma tentava parsear "host:port" como um numero e falhava.

### Contexto
- Projeto foi configurado para PostgreSQL (Neon)
- Mas o usuario nao tinha criado a conta Neon ainda
- Nao havia banco de dados acessivel

### Solucao
**Opcao A (Producao):** Criar conta Neon e usar connection string real
1. Acesse https://neon.tech
2. Crie projeto, copie connection string
3. Cole no `.env`:
```env
DATABASE_URL="postgresql://usuario:senha@ep-xxx.neon.tech:5432/db?sslmode=require"
```

**Opcao B (Desenvolvimento):** Usar SQLite
```prisma
// schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### Prevencao
- Nunca commitar `.env` com placeholders
- Adicionar validacao no startup do app
- Fornecer `.env.example` com instrucoes claras

---

## Erro 8: Prisma generate travado (EPERM no Windows)

### Sintoma
```
EPERM: operation not permitted, rename 'node_modules\.prisma\client\query_engine-windows.dll.node.tmp12345' -> 'node_modules\.prisma\client\query_engine-windows.dll.node'
```

### Causa
O processo Node.js esta usando o arquivo `query_engine-windows.dll.node`, entao o Windows nao permite sobrescreve-lo. Isso acontece quando o servidor Next.js esta rodando e voce tenta gerar o Prisma Client.

### Contexto
Comum em desenvolvimento Windows quando:
- `npm run dev` esta rodando
- Voce roda `npx prisma migrate dev` ou `npx prisma generate`
- O engine do Prisma precisa ser atualizado mas esta em uso

### Solucao
**Passo 1:** Matar todos os processos Node.js
```powershell
# PowerShell
taskkill /F /IM node.exe

# Ou
Get-Process node | Stop-Process -Force
```

**Passo 2:** Esperar 2-3 segundos

**Passo 3:** Rodar generate novamente
```bash
npx prisma generate
```

**Alternativa:** Deletar manualmente o arquivo bloqueado
```powershell
Remove-Item -Force node_modules\.prisma\client\query_engine-windows.dll.node
npx prisma generate
```

### Prevencao
- Sempre parar o servidor (`Ctrl+C`) antes de rodar `prisma generate`
- Em Windows, o arquivo pode permanecer bloqueado mesmo apos parar — use `taskkill`

---

## Erro 9: Facebook App Secret comentado no .env

### Sintoma
OAuth funciona em modo demo (redireciona com `?demo=true`), mas nunca faz exchange real de token.

### Causa
O `.env` tinha o App Secret comentado:
```env
META_APP_ID=1263856599207162
# META_APP_SECRET=[REDACTED]
```

### Contexto
O codigo verifica `if (!clientId)` para decidir entre modo demo e real. O App ID estava setado, mas o App Secret (necessario para exchange) estava comentado. A troca de token falha silenciosamente.

### Solucao
Descomentar a linha:
```env
META_APP_ID=1263856599207162
META_APP_SECRET=[REDACTED]
```

### Prevencao
- Validar todas as variaveis necessarias para uma integracao
- Adicionar log quando fallback para modo demo e ativado

---

## Erro 10: `socialAccountIds` nao enviado ao salvar post

### Sintoma
Post e salvo sem `socialAccountIds`. Ao publicar, o sistema publica em TODAS as contas conectadas em vez das selecionadas.

### Causa
O frontend nao enviava `socialAccountIds` no body do POST `/api/posts`.

### Contexto
- Formulario de criacao de post (`create-post/page.tsx`) tinha o seletor de contas
- Mas `handleSave` e `handleApproveAndSave` nao incluiam `socialAccountIds` no JSON

### Solucao
Adicionar ao body:
```ts
const res = await fetch("/api/posts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    // ... outros campos
    image: imageUrl,
    socialAccountIds: JSON.stringify(selectedAccounts), // ✅ Adicionado
  }),
});
```

### Prevencao
- Sempre verificar se todos os campos da UI estao sendo enviados
- Validar body no backend com Zod ou similar

---

## Erro 11: `notificationEmail` nao usado como fallback

### Sintoma
API de email envia para `usuario@exemplo.com` hardcoded em vez do email configurado.

### Causa
A API `/api/notifications/email` nao consultava `CompanyProfile.notificationEmail`. Usava apenas o parametro `to` do body.

### Contexto
- Settings permite configurar `notificationEmail`
- Mas a API de email ignorava esse campo
- Resultado: testes sempre iam para `usuario@exemplo.com`

### Solucao
Adicionar fallback:
```ts
const profile = await prisma.companyProfile.findUnique({
  where: { userId: user.id }
});
const targetEmail = to || profile?.notificationEmail || user.email;

if (!targetEmail) {
  return Response.json({ error: "Email de destino nao configurado" }, { status: 400 });
}
```

### Prevencao
- Sempre usar fallback chain: parametro explicito > perfil do usuario > usuario logado
- Documentar a hierarquia de fallbacks

---

## Erro 12: Campo `website` enviado mas nao existe no schema

### Sintoma
```
PrismaClientKnownRequestError: Unknown argument `website`. Available options are marked with ?.
```

### Causa
A UI de Settings (`settings/page.tsx`) tinha input para `website`, mas o schema Prisma nao tinha esse campo em `CompanyProfile`.

### Contexto
- Frontend enviava `website` no body do PUT `/api/settings`
- API fazia upsert passando o campo inteiro (`...profile`)
- Prisma rejeitava porque o campo nao existia

### Solucao
Adicionar ao schema:
```prisma
model CompanyProfile {
  // ... campos existentes
  website String? // ✅ Adicionado
}
```

### Prevencao
- Sempre sincronizar schema com UI
- Validar body da request antes de passar para Prisma
- Usar tipos gerados pelo Prisma (`Prisma.CompanyProfileCreateInput`)

---

## Erro 13: Scheduler publico sem protecao

### Sintoma
Qualquer pessoa pode chamar `GET /api/scheduler/publish` e publicar posts.

### Causa
O endpoint nao tinha autenticacao. Como precisava ser chamado pelo Vercel Cron (sem sessao de usuario), foi deixado publico.

### Contexto
- Vercel Cron chama o endpoint sem autenticacao
- Mas qualquer pessoa com a URL tambem podia chamar
- Risco: spam de publicacoes

### Solucao
Adicionar protecao por secret:
```ts
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... resto do handler
}
```

Configurar no Vercel:
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/scheduler/publish",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

O Vercel Cron envia `x-cron-secret` automaticamente.

### Prevencao
- Sempre proteger endpoints cron com secret
- Nunca confiar que "ninguem vai descobrir a URL"

---

## Erro 14: Upload de imagem sem servico de storage

### Sintoma
Campo `image` no post nunca e preenchido. Upload nao funciona.

### Causa
O app nao tinha nenhum servico de upload configurado. O campo `image` existia no schema mas nunca era populado.

### Contexto
- Instagram Graph API exige URL publica de imagem
- Nao se pode enviar arquivo binario diretamente
- Precisa de servico que hospede a imagem e retorne URL

### Solucao
Implementar upload com Cloudinary:
```ts
// lib/cloudinary.ts
export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", process.env.CLOUDINARY_API_KEY!);
  formData.append("timestamp", String(Math.round(Date.now() / 1000)));
  formData.append("signature", generateSignature(timestamp));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  return data.secure_url;
}
```

### Prevencao
- Sempre ter um servico de storage configurado desde o inicio
- Alternativas: Cloudinary, AWS S3, Supabase Storage, Vercel Blob

---

## Erro 15: OAuth salva token fake sem exchange

### Sintoma
OAuth "funciona" mas publicacao nunca envia posts reais. Sempre simulado.

### Causa
O callback OAuth recebia o `code` do Facebook, mas nao fazia o exchange por `access_token`. Salvava um token estatico (`demo-token` ou `connected-token`).

### Contexto
```ts
// ANTES (errado)
if (code) {
  await prisma.socialAccount.create({
    data: {
      accessToken: "connected-token", // ❌ Token fake!
      // ...
    }
  });
}

// DEPOIS (certo)
const tokenRes = await fetch(
  `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`
);
const tokenData = await tokenRes.json();
const accessToken = tokenData.access_token; // ✅ Token real!
```

### Solucao
Implementar exchange real:
1. Receber `code` do callback
2. Fazer POST para endpoint de token da plataforma
3. Obter `access_token`, `refresh_token`, `expires_in`
4. Calcular `expiresAt = now() + expires_in`
5. Buscar dados da conta (nome, ID) via API
6. Salvar tudo no banco

### Prevencao
- Sempre testar o OAuth end-to-end (autorizar → callback → publicar)
- Verificar se o token obtido funciona chamando a API da plataforma

---

## Checklist de Prevencao

Antes de comitar, verifique:

- [ ] Todas as rotas API tem handlers para todos os metodos usados pelo frontend
- [ ] Variaveis de ambiente necessarias estao no `.env` (nao comentadas)
- [ ] Componentes com `useSearchParams()` estao dentro de `Suspense`
- [ ] Schema Prisma e compativel com o banco usado (SQLite = sem enum)
- [ ] Seed nao usa casts `as any` desnecessarios
- [ ] Todas as integracoes tem fallback para modo demo
- [ ] Endpoints cron/publicos estao protegidos
- [ ] Uploads tem servico de storage configurado
- [ ] OAuth faz exchange real de token (nao salva fake)
- [ ] Campos da UI existem no schema Prisma

---

*Erro novo encontrado? Adicione aqui com numero sequencial, sintoma, causa, solucao e prevencao.*
