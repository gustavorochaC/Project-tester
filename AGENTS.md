# AGENTS.md — Social Pilot

> SaaS de automação de redes sociais. Next.js 16 + Prisma + PostgreSQL.

---

## Stack & Versions (do not guess)

| Tool | Version | Note |
|------|---------|------|
| Next.js | 16.2.4 | Breaking changes vs training data. Read `node_modules/next/dist/docs/` if unsure. |
| React | 19.2.4 | — |
| Prisma | 5.22.0 | NOT v7. Schema uses `url` in `datasource`. No `prisma.config.ts`. |
| Tailwind | v4 | Via `@tailwindcss/postcss` |
| DB (prod) | PostgreSQL | Neon in production. SQLite was dev-only, removed. |
| UI | shadcn + @base-ui/react | Button, DropdownMenu, etc. are `@base-ui/react` wrappers, not Radix. `asChild` was added manually to Button. |
| Auth | Custom JWT | `jose` + `bcryptjs`. Session cookie = `session`. Not NextAuth. |
| Icons | lucide-react 1.11.0 | Missing icons: `Instagram`, `Facebook`, `Linkedin`. Use `Globe`, `Share2`, `MessageSquare` instead. |

---

## Commands

```bash
# Dev
npm run dev                    # localhost:3000

# Build / Deploy
npm run build                  # local build
npm run vercel-build           # Vercel uses this; runs `next build` only (no migrate during build)
npm run postinstall            # runs `prisma generate` automatically

# Database
npm run db:migrate             # prisma migrate dev
npm run db:seed                # tsx prisma/seed.ts
DATABASE_URL="postgresql://..." npx prisma migrate deploy   # production
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts       # seed prod
```

---

## Auth & Middleware

- **Custom JWT auth** in `lib/auth.ts`. No NextAuth.
- Session stored in HTTP-only cookie named `session`.
- `middleware.ts` protects all routes except `/login`, `/register`, `/onboarding`, `/`, plus public API prefixes (`/api/auth/*`, `/api/social/callback`, `/api/scheduler/publish`).
- `AUTH_SECRET` env var required. Default fallback exists but must be overridden in production.
- To get current user in a Server Component / API route: `await getCurrentUser()` from `lib/auth`.

---

## Database

- **Production:** PostgreSQL (Neon). Connection string must include `?sslmode=require`.
- **Local dev:** If you switch back to SQLite, change `prisma/schema.prisma` `provider` to `sqlite`, delete `prisma/migrations/`, delete `prisma/dev.db`, then `npx prisma migrate dev --name init`.
- **Do NOT run `prisma migrate deploy` during Vercel build** — the build machine can't reach Neon reliably. Migrations are applied manually or via CI.
- Models: `User`, `CompanyProfile`, `Post`, `Client`, `Trend`, `NotificationSettings`, `SocialAccount`.
- Prisma client imported from `@prisma/client` (standard location, no custom output path).

---

## API Routes — Next.js 16 Quirk

Dynamic route params are a **Promise** in Next.js 16:

```ts
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // MUST await
}
```

Forgetting `await` causes a TypeScript build error.

---

## Optional Integrations (all have fallbacks)

If the env var is missing, the feature works in **simulated/demo mode**:

| Feature | Env Var | Fallback behavior |
|---------|---------|-------------------|
| AI post generation | `GOOGLE_AI_API_KEY` | Templates based on company profile |
| Instagram/Facebook publish | `META_APP_ID`, `META_APP_SECRET` | Simulated publish |
| LinkedIn publish | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | Simulated publish |
| WhatsApp notifications | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` | Console log + toast |
| Email notifications | `RESEND_API_KEY`, `FROM_EMAIL` | Console log + toast |

---

## Project Structure

```
app/
  (app)/           # Logged-in pages (dashboard, calendar, pending, trends, reports, settings, agency, create-post)
  api/             # All API routes
    auth/          # login, register, logout, me
    ai/generate    # Google Gemini post generation
    posts/         # CRUD posts
    clients/       # CRUD clients
    trends/        # CRUD trends
    settings/      # Profile + notifications
    dashboard/     # Aggregated metrics
    social/        # OAuth + publish + accounts
    scheduler/     # Auto-publish cron endpoint
    notifications/ # WhatsApp + email
    reports/       # Export data for PDF
  login/           # Login page
  register/        # Registration page
  onboarding/      # 5-step wizard
  page.tsx         # Redirects to /login

components/
  auth-provider.tsx       # React context for auth state
  layout/header.tsx       # User avatar + logout
  layout/sidebar.tsx      # Navigation
  publish-now-button.tsx  # Instant publish CTA
  ui/                     # shadcn/ui components (custom @base-ui)

lib/
  auth.ts            # JWT session, password hash, getCurrentUser
  prisma.ts          # Singleton PrismaClient
  mock-data.ts       # Static maps (labels, colors) still used by UI
```

---

## Environment Variables

Required:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — min 32 chars
- `NEXT_PUBLIC_APP_URL` — e.g. `https://social-pilot-app.vercel.app`

Optional (see fallbacks above):
- `GOOGLE_AI_API_KEY`
- `META_APP_ID`, `META_APP_SECRET`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- `RESEND_API_KEY`, `FROM_EMAIL`

`.env` is gitignored. `.env.example` is committed.

---

## Deployment (Vercel + Neon)

See `DEPLOY.md` for the full guide.

Quick flow:
1. `npx vercel --prod` (or GitHub import)
2. Set env vars in Vercel dashboard
3. Run migrations manually against Neon: `DATABASE_URL="..." npx prisma migrate deploy`
4. Optionally seed: `DATABASE_URL="..." npx tsx prisma/seed.ts`
5. Redeploy if needed

---

## Server Components — NEVER fetch internal APIs

Server Components (async pages in `app/`) must **never** call `fetch()` to their own API routes (`/api/*`).

**Why it breaks:**  
Inside a Server Component, `fetch("http://localhost:3000/api/...")` fails on Vercel because there is no local dev server running during SSR. If you rely on `NEXT_PUBLIC_APP_URL`, a missing env var causes `ECONNREFUSED` and a **500 error** that only shows "This page couldn't load" to the user.

**What to do instead:**  
Call Prisma (or any server-side logic) directly:

```tsx
// app/(app)/dashboard/page.tsx  ✅ CORRECT
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const data = await getDashboardData(); // Prisma call, no fetch
  return <div>...</div>;
}
```

```ts
// lib/dashboard-data.ts  ✅ CORRECT
import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return prisma.post.findMany({ where: { userId: user.id } });
}
```

**When `fetch` is okay:**
- Inside Client Components (`"use client"`) using `useEffect`
- Calling **external** APIs (Stripe, OpenAI, etc.)
- Inside API routes (`app/api/*`) calling external services

**Reference incident:**  
Apr 25 2026 — Login redirected to `/dashboard`, which did `fetch("${NEXT_PUBLIC_APP_URL}/api/dashboard")`. On Vercel this env was missing, causing ECONNREFUSED and a blank 500 page. Fixed by replacing the fetch with direct Prisma calls (`lib/dashboard-data.ts`, `lib/clients-data.ts`).

---

## Common Mistakes to Avoid

1. **Don't use Prisma v7 syntax** — this repo uses v5.22.0. No `prisma.config.ts`, no `adapter` in client constructor.
2. **Don't `await params` incorrectly** — Next.js 16 dynamic route params are `Promise<{id}>`. Await them.
3. **Don't assume Radix UI** — components are `@base-ui/react` wrappers. `DropdownMenuTrigger` does NOT have `asChild`; Button `asChild` was custom-added.
4. **Don't commit `.env`** — it's gitignored. Use `.env.example` as template.
5. **Don't run `prisma migrate deploy` in `vercel-build`** — the builder can't reach Neon. Migrations are manual/CI-only.
6. **Don't panic if Google AI/Twilio/Resend is missing** — everything degrades to demo mode gracefully.
7. **Don't `fetch()` internal APIs from Server Components** — call Prisma directly (see "Server Components" section above).
