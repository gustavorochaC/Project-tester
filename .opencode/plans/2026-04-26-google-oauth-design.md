# Design: Google OAuth Login

## Contexto
O Social Pilot usa autenticação customizada baseada em JWT (`jose` + `bcryptjs`), com sessão em cookie HTTP-only chamado `session`. Não usa NextAuth/Auth.js. O objetivo é permitir que usuários façam login e criem contas usando sua conta Google, mantendo 100% de compatibilidade com o sistema existente.

## Decisões Arquiteturais

### Abordagem: OAuth 2.0 nativo manual
Implementamos o fluxo OAuth do Google diretamente, sem bibliotecas de auth all-in-one.
- **Por quê**: preserva o sistema JWT customizado, middleware, cookie `session` e `getCurrentUser()` existentes. Adiciona o Google como mais um método de entrada.
- **Alternativa rejeitada**: NextAuth/Auth.js exigiria reescrever toda a camada de autenticação (middleware, provider, cookie, sessão).

### Auto-linking de contas existentes
Se um usuário já possui uma conta criada com email+senha, e faz login com Google usando o **mesmo email verificado**, a conta é vinculada automaticamente.
- **Justificativa**: Google garante `email_verified: true` no token ID. Isso é padrão de mercado (Vercel, Figma, Linear).
- **Comportamento**: o `googleId` é salvo no usuário existente. A senha permanece intacta — o usuário pode continuar logando por ambos os métodos.

### Password opcional
Usuários criados via Google não possuem senha. O campo `password` no schema Prisma torna-se opcional (`String?`).
- **Implicação**: rotas que dependem de `verifyPassword` (login normal) já tratam usuário não encontrado; não há impacto.

## Mudanças no Schema (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String?  // <- torna-se opcional
  image     String?  // <- avatar do Google
  googleId  String?  @unique // <- ID do Google para vinculação
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  companyProfile CompanyProfile?
  posts          Post[]
  clients        Client[]
  trends         Trend[]
  notification   NotificationSettings?
  socialAccounts SocialAccount[]
}
```

> A migration deve ser gerada e aplicada manualmente contra o banco de produção (conforme regra do projeto: não rodar migrate deploy no build da Vercel).

## Variáveis de Ambiente

Adicionar em `.env` e `.env.example`:

```bash
# Google OAuth 2.0
# Criar em https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
```

## Fluxo de Dados

### 1. Iniciar login (/api/auth/google — GET)
1. Monta URL de autorização do Google com:
   - `client_id`
   - `redirect_uri = ${NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
   - `response_type = code`
   - `scope = openid email profile`
   - `access_type = offline` (para obter refresh token, se necessário no futuro)
   - `prompt = consent select_account`
   - `state = randomToken` (CSRF protection — salvo em cookie `google_oauth_state`, httpOnly, secure, sameSite lax, maxAge 5min)
2. Redireciona o navegador para `https://accounts.google.com/o/oauth2/v2/auth?...`

### 2. Callback do Google (/api/auth/google/callback — GET)
1. Lê `code` e `state` da query string.
2. Valida `state` contra o cookie `google_oauth_state`. Se divergir, retorna 403.
3. Troca `code` por tokens via POST em `https://oauth2.googleapis.com/token`.
4. Decodifica o `id_token` JWT do Google (sem verificar assinatura no backend é aceitável para obter claims, mas verificamos via endpoint `https://oauth2.googleapis.com/tokeninfo?id_token=...` ou validando com a chave pública do Google para segurança máxima).
5. Extrai `sub` (googleId), `email`, `email_verified`, `name`, `picture`.
6. Se `email_verified !== true`, redireciona para `/login?error=google_email_nao_verificado`.
7. Busca usuário por `googleId`. Se encontrar → passo 10.
8. Busca usuário por `email`. Se encontrar → atualiza `googleId` e `image` (auto-linking) → passo 10.
9. Se não encontrar → cria novo `User` com `googleId`, `email`, `name`, `image`, password `null`.
10. Cria `CompanyProfile` e `NotificationSettings` padrão (mesmo padrão do registro normal).
11. Chama `createSession(user.id)` para gerar o JWT da sessão no cookie `session`.
12. Redireciona para `/dashboard`.

### 3. Erros
- Qualquer erro no callback redireciona para `/login?error=<codigo>`.
- A página de login lê o query param `error` e exibe `toast.error()` com mensagem traduzida.
- Códigos de erro: `google_email_nao_verificado`, `google_troca_code_falhou`, `google_perfil_invalido`, `google_estado_invalido`.

## Mudanças no Middleware

Adicionar as novas rotas às listas de rotas públicas:

```ts
const publicRoutes = ["/login", "/register", "/onboarding", "/"];
const apiPublicRoutes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/google",          // <- novo
  "/api/auth/google/callback", // <- novo
  "/api/social/callback",
  "/api/scheduler/publish",
];
```

## Mudanças na UI

### Login (/login)
- Abaixo do botão "Entrar", adicionar `<Separator />` com texto "ou".
- Botão "Entrar com Google": `Button variant="outline" className="w-full"`.
- Ícone do Google como SVG inline colorido (18px), à esquerda do texto.
- Ao clicar: `window.location.href = "/api/auth/google"` (navegação real, não fetch).
- Estado de loading: `disabled` + `<Loader2 className="animate-spin" />`.

### Registro (/register)
- Mesmo padrão visual do login.
- Texto do botão: "Criar conta com Google".
- Comportamento idêntico (o mesmo endpoint `/api/auth/google` decide se cria ou vincula).

### Auth Provider (components/auth-provider.tsx)
- Adicionar método `loginWithGoogle()` que apenas redireciona para `/api/auth/google`.
- A página de login/register pode usar diretamente `window.location.href` sem passar pelo contexto, mas manter no provider é mais limpo para futura extensibilidade.

### Tratamento de erro por URL
- Na página de login, usar `useSearchParams` para capturar `?error=...`.
- Exibir `toast.error()` no `useEffect` inicial com mensagens mapeadas.

## Segurança

1. **CSRF protection**: parâmetro `state` aleatório (32 bytes, base64url) salvo em cookie `google_oauth_state` httpOnly, secure, sameSite lax, maxAge 5 min. Validado no callback.
2. **Email verificado**: só prossegue se `email_verified === true` no token do Google.
3. **Sem exposição de secrets**: `GOOGLE_CLIENT_SECRET` nunca sai do servidor.
4. **Cookie de sessão**: reutiliza `createSession()` existente, com as mesmas flags httpOnly/secure/sameSite.

## Testes e Validação

- Login com Google em conta nova → cria usuário, perfil, notificações, redireciona para dashboard.
- Login com Google em email já existente (sem googleId) → vincula googleId, mantém senha, loga normalmente.
- Login com Google em email já existente (com googleId) → loga direto.
- Cancelar no Google → volta para login sem erro.
- `state` manipulado → erro 403 no callback, redireciona para login com erro.
- `email_verified = false` → redireciona para login com erro específico.

## Checklist de Implementação

1. [ ] Adicionar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` ao `.env.example`.
2. [ ] Alterar schema Prisma (`password?`, `googleId?`, `image?`).
3. [ ] Gerar e aplicar migration.
4. [ ] Criar `lib/google-oauth.ts` (helpers: gerar state, trocar code, validar token, parse profile).
5. [ ] Criar `app/api/auth/google/route.ts` (inicia fluxo).
6. [ ] Criar `app/api/auth/google/callback/route.ts` (finaliza fluxo).
7. [ ] Atualizar `middleware.ts` (rotas públicas).
8. [ ] Atualizar `components/auth-provider.tsx` (método Google).
9. [ ] Atualizar `app/login/page.tsx` (botão Google + tratamento de erro por URL).
10. [ ] Atualizar `app/register/page.tsx` (botão Google).
11. [ ] Testar localmente (`npm run dev`).
