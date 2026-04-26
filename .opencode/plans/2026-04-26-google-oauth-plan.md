# Google OAuth Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que usuários façam login e criem contas no Social Pilot usando Google OAuth 2.0, mantendo 100% de compatibilidade com o sistema JWT customizado existente.

**Architecture:** Fluxo OAuth 2.0 nativo manual. Rota `/api/auth/google` inicia o fluxo salvando um `state` CSRF em cookie e redirecionando para o Google. Rota `/api/auth/google/callback` troca o `code` por token, valida o perfil, cria ou vincula o usuário no Prisma, e emite o JWT de sessão via `createSession()` existente. UI adiciona botão "Entrar com Google" nas páginas de login e registro usando componentes shadcn.

**Tech Stack:** Next.js 16 App Router, Prisma 5.22, PostgreSQL, jose (JWT), shadcn/ui (@base-ui/react), lucide-react.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `.env.example` | Modify | Documentar novas variáveis `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` |
| `prisma/schema.prisma` | Modify | Tornar `password` opcional, adicionar `googleId` e `image` ao `User` |
| `lib/google-oauth.ts` | Create | Helpers puros: gerar state, construir URLs, trocar code, validar token, parse profile |
| `app/api/auth/google/route.ts` | Create | Inicia fluxo OAuth: gera state cookie e redireciona para Google |
| `app/api/auth/google/callback/route.ts` | Create | Finaliza fluxo: valida state, troca code, cria/vincula usuário, emite sessão |
| `middleware.ts` | Modify | Adicionar `/api/auth/google` e `/api/auth/google/callback` como rotas públicas |
| `components/auth-provider.tsx` | Modify | Adicionar método `loginWithGoogle()` ao contexto |
| `app/login/page.tsx` | Modify | Adicionar botão Google, separador "ou", tratamento de erro por query param |
| `app/register/page.tsx` | Modify | Adicionar botão Google, separador "ou" |

---

### Task 1: Atualizar `.env.example` com variáveis do Google OAuth

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Adicionar variáveis ao final do arquivo**

```bash
# Google OAuth 2.0
# Crie em https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
```

- [ ] **Step 2: Verificar que as variáveis foram adicionadas**

Run: `Select-String -Path .env.example -Pattern "GOOGLE_CLIENT"`
Expected: duas linhas com GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore(env): add Google OAuth environment variables"
```

---

### Task 2: Alterar schema Prisma

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Modificar model User**

Substituir o bloco `model User` (linhas 10-25) por:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String?
  image     String?
  googleId  String?  @unique
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

- [ ] **Step 2: Gerar migration**

Run: `npx prisma migrate dev --name add_google_oauth_to_user`
Expected: Migration criada com alterações de coluna (password nullable, add image, add googleId unique).

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add googleId, image and make password optional on User"
```

---

### Task 3: Criar helpers de OAuth (`lib/google-oauth.ts`)

**Files:**
- Create: `lib/google-oauth.ts`

- [ ] **Step 1: Escrever o arquivo com helpers**

```typescript
import { SignJWT, jwtVerify } from "jose";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function getGoogleAuthUrl(state: string): string {
  const redirectUri = `${APP_URL}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function generateState(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Buffer.from(arr).toString("base64url");
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  id_token: string;
}> {
  const redirectUri = `${APP_URL}/api/auth/google/callback`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`google_token_exchange_failed: ${text}`);
  }

  const data = await res.json();
  if (!data.access_token || !data.id_token) {
    throw new Error("google_token_exchange_invalid_response");
  }
  return data;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  // Validate signature and claims using Google's public keys via their tokeninfo endpoint
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!res.ok) {
    throw new Error("google_id_token_invalid");
  }
  const payload = await res.json();
  if (payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("google_id_token_audience_mismatch");
  }
  if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") {
    throw new Error("google_id_token_issuer_invalid");
  }
  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified === "true" || payload.email_verified === true,
    name: payload.name,
    picture: payload.picture,
  };
}
```

- [ ] **Step 2: Verificar types e imports**

Run: `npx tsc --noEmit lib/google-oauth.ts`
Expected: Sem erros de compilação (pode ignorar warnings de config se houver, mas não erros de tipo).

- [ ] **Step 3: Commit**

```bash
git add lib/google-oauth.ts
git commit -m "feat(auth): add Google OAuth helpers"
```

---

### Task 4: Criar rota de início do OAuth (`app/api/auth/google/route.ts`)

**Files:**
- Create: `app/api/auth/google/route.ts`

- [ ] **Step 1: Escrever a route handler**

```typescript
import { NextResponse } from "next/server";
import { generateState, getGoogleAuthUrl } from "@/lib/google-oauth";

export async function GET() {
  const state = generateState();
  const url = getGoogleAuthUrl(state);

  const response = NextResponse.redirect(url);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5, // 5 minutes
    path: "/",
    sameSite: "lax",
  });

  return response;
}
```

- [ ] **Step 2: Verificar compilação**

Run: `npx tsc --noEmit app/api/auth/google/route.ts`
Expected: Sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/google/route.ts
git commit -m "feat(api): add Google OAuth init endpoint"
```

---

### Task 5: Criar rota de callback do OAuth (`app/api/auth/google/callback/route.ts`)

**Files:**
- Create: `app/api/auth/google/callback/route.ts`

- [ ] **Step 1: Escrever a route handler**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { exchangeCodeForTokens, verifyGoogleIdToken } from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseRedirect = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${baseRedirect}/login?error=google_cancelled`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseRedirect}/login?error=google_missing_params`);
  }

  // Validate state CSRF token
  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${baseRedirect}/login?error=google_estado_invalido`);
  }
  // Clear state cookie immediately
  cookieStore.delete("google_oauth_state");

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await verifyGoogleIdToken(tokens.id_token);

    if (!profile.email_verified) {
      return NextResponse.redirect(`${baseRedirect}/login?error=google_email_nao_verificado`);
    }

    // 1. Try to find user by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: profile.sub },
    });

    // 2. Auto-link: if not found by googleId, try by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: profile.email },
      });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: profile.sub,
            image: profile.picture || user.image,
          },
        });
      }
    }

    // 3. Create new user if not found
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name || null,
          image: profile.picture || null,
          googleId: profile.sub,
          password: null,
        },
      });

      await prisma.companyProfile.create({
        data: {
          userId: user.id,
          companyName: profile.name || "Minha Empresa",
          segment: "",
          plan: "starter",
        },
      });

      await prisma.notificationSettings.create({
        data: {
          userId: user.id,
        },
      });
    }

    await createSession(user.id);
    return NextResponse.redirect(`${baseRedirect}/dashboard`);
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${baseRedirect}/login?error=google_troca_code_falhou`);
  }
}
```

- [ ] **Step 2: Verificar compilação**

Run: `npx tsc --noEmit app/api/auth/google/callback/route.ts`
Expected: Sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/google/callback/route.ts
git commit -m "feat(api): add Google OAuth callback endpoint with auto-linking"
```

---

### Task 6: Atualizar middleware para rotas públicas

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Adicionar rotas à lista `apiPublicRoutes`**

Substituir o array `apiPublicRoutes` (linhas 9-15) por:

```typescript
const apiPublicRoutes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/social/callback",
  "/api/scheduler/publish",
];
```

- [ ] **Step 2: Verificar que não há outras alterações necessárias**

O restante do middleware já redireciona para /login em caso de token ausente/inválido, o que continua correto.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat(middleware): allow Google OAuth routes as public"
```

---

### Task 7: Aticionar `loginWithGoogle` ao Auth Provider

**Files:**
- Modify: `components/auth-provider.tsx`

- [ ] **Step 1: Atualizar interface AuthContextType**

Adicionar `loginWithGoogle` ao interface:

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
}
```

- [ ] **Step 2: Implementar `loginWithGoogle` no provider**

Adicionar a função antes do `return`:

```typescript
  const loginWithGoogle = () => {
    window.location.href = "/api/auth/google";
  };
```

Atualizar o value do Provider:

```typescript
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
```

- [ ] **Step 3: Commit**

```bash
git add components/auth-provider.tsx
git commit -m "feat(auth): add loginWithGoogle to auth context"
```

---

### Task 8: Atualizar tela de Login (`app/login/page.tsx`)

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Adicionar imports necessários**

Substituir os imports existentes pelos seguintes (mantendo os anteriores e adicionando `useSearchParams`, `useEffect`, `Separator`):

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
```

- [ ] **Step 2: Adicionar lógica de erro por URL e botão Google**

Substituir o componente `LoginPage` inteiro por:

```tsx
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const messages: Record<string, string> = {
        google_email_nao_verificado: "Email do Google não verificado.",
        google_troca_code_falhou: "Falha na autenticação com Google. Tente novamente.",
        google_perfil_invalido: "Não foi possível obter seu perfil do Google.",
        google_estado_invalido: "Sessão de autenticação inválida. Tente novamente.",
        google_cancelled: "Login com Google cancelado.",
        google_missing_params: "Parâmetros de autenticação incompletos.",
      };
      toast.error(messages[error] || "Erro ao fazer login com Google");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login realizado com sucesso!");
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    loginWithGoogle();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Social Pilot</CardTitle>
          <CardDescription>
            Automacao inteligente para suas redes sociais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Entrar com Google
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Nao tem conta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Criar conta
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat(ui): add Google login button and URL error handling"
```

---

### Task 9: Atualizar tela de Registro (`app/register/page.tsx`)

**Files:**
- Modify: `app/register/page.tsx`

- [ ] **Step 1: Adicionar imports e atualizar estado**

Adicionar ao topo (junto aos outros imports):

```typescript
import { Separator } from "@/components/ui/separator";
```

Dentro do componente, adicionar estado e handler:

```typescript
  const { register, loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleRegister = () => {
    setGoogleLoading(true);
    loginWithGoogle();
  };
```

- [ ] **Step 2: Inserir separador e botão Google no JSX**

Após o fechamento da tag `</form>` e antes do `div` com "Ja tem conta?", inserir:

```tsx
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Criar conta com Google
          </Button>
```

- [ ] **Step 3: Commit**

```bash
git add app/register/page.tsx
git commit -m "feat(ui): add Google register button"
```

---

### Task 10: Testes manuais e validação

- [ ] **Step 1: Iniciar servidor de desenvolvimento**

Run: `npm run dev`
Expected: Servidor iniciando em localhost:3000 sem erros de build.

- [ ] **Step 2: Verificar que a rota /api/auth/google redireciona corretamente**

Acesse no navegador: `http://localhost:3000/api/auth/google`
Expected: Redirecionamento para `accounts.google.com/o/oauth2/v2/auth` com os parâmetros corretos (client_id, redirect_uri, scope, state). Verificar no Network tab do DevTools.

- [ ] **Step 3: Testar login com Google (conta nova)**

1. Acesse `/login`, clique em "Entrar com Google".
2. Complete o fluxo no Google com uma conta nova.
3. Expected: Redirecionado para `/dashboard`. Usuário criado no banco com `password=null`, `googleId` preenchido, `companyProfile` e `notificationSettings` criados.
4. Verificar no banco: `npx prisma studio` → tabelas User, CompanyProfile, NotificationSettings.

- [ ] **Step 4: Testar login com Google (auto-linking)**

1. Crie uma conta normal via `/register` com um email X.
2. Faça logout.
3. Clique em "Entrar com Google" usando o mesmo email X.
4. Expected: Logado direto, redirecionado para `/dashboard`. No banco, o `User` agora possui `googleId` preenchido além da senha.

- [ ] **Step 5: Testar cancelamento no Google**

1. Clique em "Entrar com Google".
2. Na tela do Google, clique em "Cancelar" ou volte ao site.
3. Expected: Voltou para `/login` sem toast de erro (ou com toast "Login com Google cancelado" se o Google retornar `error=access_denied`).

- [ ] **Step 6: Testar state inválido (simulação)**

1. Inicie o fluxo Google.
2. Antes de autorizar, delete o cookie `google_oauth_state` no DevTools.
3. Autorize no Google.
4. Expected: Redirecionado para `/login?error=google_estado_invalido` com toast de erro.

- [ ] **Step 7: Commit final (opcional)**

Se todos os testes passaram:

```bash
git log --oneline -10
```

Expected: Commits ordenados de Task 1 a Task 9.

---

## Self-Review Checklist

- [ ] **Spec coverage:**
  - Schema Prisma alterado (password opcional, googleId, image) → Task 2
  - Variáveis de ambiente documentadas → Task 1
  - Helpers OAuth puros → Task 3
  - Rota de início com state CSRF → Task 4
  - Rota de callback com troca de code, validação, auto-linking, criação de user/perfil/notificações → Task 5
  - Middleware atualizado → Task 6
  - Auth provider com loginWithGoogle → Task 7
  - UI login com botão Google, separador, tratamento de erro → Task 8
  - UI register com botão Google, separador → Task 9
  - Testes manuais descritos → Task 10

- [ ] **Placeholder scan:** Nenhum TBD, TODO, "implementar depois", ou "similar a Task X".

- [ ] **Type consistency:** `googleId` é `String? @unique` no schema, usado como `profile.sub` (string) no callback. `image` é `String?` no schema e `profile.picture || null`. `password` é `String?` no schema e `null` no create. Todos os tipos alinham.

- [ ] **DRY:** Criação de `CompanyProfile` e `NotificationSettings` no callback replica exatamente a lógica da rota de registro. Se no futuro isso mudar, deve ser extraído para uma função compartilhada — mas fora do escopo deste plano (YAGNI).
