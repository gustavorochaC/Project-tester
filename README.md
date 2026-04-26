# 🚀 Social Pilot

> **SaaS de automação de redes sociais** — Gerencie, agende e publique conteúdo em múltiplas plataformas sociais a partir de um único dashboard inteligente.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql)](https://neon.tech/)

---

## ✨ O que é o Social Pilot?

O **Social Pilot** é uma plataforma completa de gestão de redes sociais que permite:

- **📅 Agendamento Inteligente** — Programe posts para Instagram, Facebook e LinkedIn com um calendário visual intuitivo
- **🔐 Login com Google** — Autenticação via Google OAuth 2.0 com auto-linking de contas existentes
- **🤖 Geração de Conteúdo com IA** — Crie posts automaticamente usando Google Gemini baseado no perfil da sua empresa
- **📊 Dashboard Analítico** — Acompanhe métricas, tendências e performance do seu conteúdo
- **👥 Gestão de Clientes** — Organize múltiplos clientes e contas em um só lugar
- **🔔 Notificações Automáticas** — Receba alertas via WhatsApp e e-mail sobre publicações e interações
- **📄 Relatórios em PDF** — Gere relatórios profissionais para seus clientes

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Framework** | Next.js (App Router) | 16.2.4 |
| **Frontend** | React + TypeScript | 19.2.4 |
| **Estilização** | Tailwind CSS v4 + shadcn/ui | v4 |
| **Banco de Dados** | PostgreSQL (Neon) | — |
| **ORM** | Prisma | 5.22.0 |
| **Autenticação** | JWT Custom (`jose` + `bcryptjs`) + Google OAuth 2.0 | — |
| **UI Components** | @base-ui/react | — |
| **Ícones** | lucide-react | 1.11.0 |
| **Deploy** | Vercel | — |

---

## 🚀 Começando

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) (ou uma conta na [Neon](https://neon.tech/))

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/social-pilot.git
cd social-pilot

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 4. Execute as migrações do banco de dados
npm run db:migrate

# 5. (Opcional) Popule o banco com dados iniciais
npm run db:seed

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

### Obrigatórias

```env
# Banco de dados
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

# Autenticação (mínimo 32 caracteres)
AUTH_SECRET="sua-chave-secreta-super-segura-aqui"

# URL da aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Opcionais (modo demo ativado se omitidas)

```env
# Google OAuth 2.0 (Login com Google)
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"

# Google Gemini AI
GOOGLE_AI_API_KEY="sua-chave-gemini"

# Meta (Instagram/Facebook)
META_APP_ID="seu-app-id"
META_APP_SECRET="seu-app-secret"

# LinkedIn
LINKEDIN_CLIENT_ID="seu-client-id"
LINKEDIN_CLIENT_SECRET="seu-client-secret"

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID="seu-account-sid"
TWILIO_AUTH_TOKEN="seu-auth-token"
TWILIO_WHATSAPP_NUMBER="seu-numero"

# Resend (E-mail)
RESEND_API_KEY="sua-api-key"
FROM_EMAIL="noreply@seudominio.com"
```

> 💡 **Nota:** Se as variáveis opcionais não forem configuradas, a aplicação funciona normalmente em **modo demo/simulado**.

---

## 📁 Estrutura do Projeto

```
app/
├── (app)/                    # Área logada (dashboard, calendário, etc.)
│   ├── dashboard/
│   ├── calendar/
│   ├── pending/
│   ├── trends/
│   ├── reports/
│   ├── settings/
│   ├── agency/
│   └── create-post/
├── api/                      # Rotas da API
│   ├── auth/                 # Login, registro, logout
│   ├── ai/generate           # Geração de posts com IA
│   ├── posts/                # CRUD de posts
│   ├── clients/              # CRUD de clientes
│   ├── trends/               # CRUD de tendências
│   ├── settings/             # Perfil e notificações
│   ├── dashboard/            # Métricas agregadas
│   ├── social/               # OAuth + publicação + contas
│   ├── scheduler/            # Cron de publicação automática
│   ├── notifications/        # WhatsApp + e-mail
│   └── reports/              # Exportação de dados
├── login/                    # Página de login
├── register/                 # Página de cadastro
├── onboarding/               # Wizard de 5 passos
└── page.tsx                  # Redireciona para /login

components/
├── auth-provider.tsx         # Contexto de autenticação
├── layout/
│   ├── header.tsx            # Avatar + logout
│   └── sidebar.tsx           # Navegação lateral
├── publish-now-button.tsx    # Botão de publicação instantânea
└── ui/                       # Componentes shadcn/ui

lib/
├── auth.ts                   # Sessão JWT, hash de senha, getCurrentUser
├── prisma.ts                 # PrismaClient singleton
└── mock-data.ts              # Dados estáticos da UI
```

---

## 🧑‍💻 Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Inicia o servidor de desenvolvimento (localhost:3000)

# Build
npm run build                  # Build local
npm run vercel-build           # Build para Vercel (sem migrate)

# Banco de Dados
npm run db:migrate             # Executa migrações do Prisma (dev)
npm run db:seed                # Popula o banco com dados iniciais

# Produção (Neon)
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

---

## 🔌 Integrações Suportadas

| Serviço | Funcionalidade | Fallback (sem env) |
|---------|---------------|-------------------|
| **Google OAuth** | Login com conta Google | Login com email/senha apenas |
| **Google Gemini** | Geração de posts com IA | Templates baseados no perfil da empresa |
| **Instagram/Facebook** | Publicação direta | Simulação de publicação |
| **LinkedIn** | Publicação direta | Simulação de publicação |
| **Twilio WhatsApp** | Notificações via WhatsApp | Console log + toast |
| **Resend** | Notificações via e-mail | Console log + toast |

---

## 🚀 Deploy na Vercel

1. **Importe o projeto** na [Vercel](https://vercel.com/) ou use o CLI:
   ```bash
   npx vercel --prod
   ```

2. **Configure as variáveis de ambiente** no painel da Vercel

3. **Execute as migrações** manualmente no Neon:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

4. **(Opcional) Popule o banco:**
   ```bash
   DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
   ```

5. **Reinicie o deploy** se necessário

> ⚠️ **Importante:** Não execute `prisma migrate deploy` durante o build na Vercel. A máquina de build pode não conseguir acessar o Neon. Migrações devem ser aplicadas manualmente ou via CI.

---

## 🧩 Principais Funcionalidades

### 🎯 Para Agências e Freelancers
- Gestão de múltiplos clientes em um único dashboard
- Relatórios profissionais em PDF para entregar aos clientes
- Controle de permissões e acesso

### 📅 Para Criadores de Conteúdo
- Calendário visual completo de postagens
- Agendamento em massa
- Preview de posts antes da publicação

### 🤖 Automação com IA
- Geração automática de legendas e hashtags
- Sugestões baseadas no perfil da empresa
- Otimização de horários de publicação

### 📊 Analytics
- Métricas de engajamento
- Tendências de conteúdo
- Performance por plataforma

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma **issue** ou enviar um **pull request**.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

## 📬 Contato

Tem dúvidas ou sugestões? Entre em contato!

- **GitHub Issues:** [Abrir issue](https://github.com/seu-usuario/social-pilot/issues)
- **Email:** contato@seudominio.com

---

<p align="center">
  Feito com 💜 por <strong>Social Pilot Team</strong>
</p>
