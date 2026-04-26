# Guia de Configuração: Facebook / Instagram OAuth

> Última atualização: 2026-04-25

---

## 1. Criar um App no Facebook Developers

### Passo 1.1: Acesse o portal
- Vá para: https://developers.facebook.com/apps/
- Faça login com sua conta do Facebook

### Passo 1.2: Criar novo app
1. Clique no botão **"Criar aplicativo"** (verde, no topo direito)
2. Na tela "Criar aplicativo", escolha o caso de uso:
   - Selecione **"Outro"**
   - Clique em **"Avançar"**
3. Escolha o tipo de app:
   - Selecione **"Empresa"** (Business)
   - Clique em **"Avançar"**
4. Preencha as informações:
   - **Nome do aplicativo**: `Social Pilot` (ou qualquer nome)
   - **Email de contato do aplicativo**: seu email
   - **Conta comercial do Meta Business**: selecione sua conta ou crie uma nova
   - Clique em **"Criar aplicativo"**
5. Pode pedir para confirmar senha do Facebook — confirme

---

## 2. Configurar Facebook Login

### Passo 2.1: Adicionar o produto
1. No painel do app, você verá uma seção **"Adicionar produto"**
2. Encontre **"Login do Facebook"** (Facebook Login)
3. Clique em **"Configurar"**

### Passo 2.2: Configurar URLs de redirecionamento
1. No menu lateral esquerdo, clique em:
   ```
   Login do Facebook → Configurações
   ```
2. Você verá o campo:
   ```
   Valid OAuth Redirect URIs
   (URLs de redirecionamento do OAuth válidas)
   ```
3. Adicione estas URLs exatas (uma por linha):
   ```
   http://localhost:3000/api/social/callback/facebook
   http://localhost:3000/api/social/callback/instagram
   ```
   > ⚠️ **Importante**: Substitua `localhost:3000` pela URL real se estiver em produção
4. Clique em **"Salvar alterações"** (no canto inferior)

---

## 3. Configurar Instagram Graph API

### Passo 3.1: Adicionar o produto
1. No painel do app, em **"Adicionar produto"**
2. Encontre **"API Graph do Instagram"** (Instagram Graph API)
3. Clique em **"Configurar"**

### Passo 3.2: Verificar permissões necessárias
As permissões abaixo já devem estar disponíveis automaticamente:
- `instagram_basic`
- `instagram_content_publish`
- `pages_read_engagement`
- `pages_manage_posts`

---

## 4. Obter as Credenciais

### Passo 4.1: App ID e App Secret
1. No menu lateral, vá em:
   ```
   Configurações → Básico
   ```
2. Você verá:
   - **ID do aplicativo (App ID)**: algo como `123456789012345`
   - **Chave secreta do aplicativo (App Secret)**: clique em **"Mostrar"** para revelar
3. Copie ambos e cole no arquivo `.env` do projeto:
   ```env
   META_APP_ID=seu-app-id-aqui
   META_APP_SECRET=seu-app-secret-aqui
   ```

---

## 5. Configurar Página do Facebook (Obrigatório para Instagram)

> ⚠️ **IMPORTANTE**: Para publicar no Instagram via API, você precisa:
> 1. Uma página do Facebook Business
> 2. Uma conta Instagram Business vinculada a essa página

### Passo 5.1: Criar página (se não tiver)
1. Vá para: https://www.facebook.com/pages/create
2. Escolha a categoria do seu negócio
3. Preencha nome e informações
4. Crie a página

### Passo 5.2: Vincular Instagram à página
1. Na página do Facebook, clique em:
   ```
   Configurações → Instagram
   ```
2. Clique em **"Conectar conta do Instagram"**
3. Faça login com sua conta Instagram Business
4. Autorize a conexão

---

## 6. Configurar Usuário de Teste (Recomendado)

### Passo 6.1: Criar usuário de teste
1. No menu lateral do app, vá em:
   ```
   Funções do app → Usuários de teste
   ```
2. Clique em **"Criar usuários de teste"**
3. Preencha:
   - Quantidade: `1`
   - Permissões: `administrador`
4. Clique em **"Criar"**
5. Anote o email e senha do usuário de teste criado

### Passo 6.2: Usar usuário de teste
- Use esse usuário para fazer login durante os testes
- Ou use sua própria conta (deve ser admin da página)

---

## 7. Testar a Integração

### Passo 7.1: Iniciar o app
```bash
npm run dev
```

### Passo 7.2: Conectar Instagram
1. Acesse: http://localhost:3000/integrations
2. Na aba **"Contas Conectadas"**
3. Clique no botão **"instagram"**
4. Vai abrir a tela do Facebook para autorizar
5. Use sua conta (ou usuário de teste)
6. Autorize o app
7. Selecione a página que tem Instagram vinculado
8. Pronto! A conta aparecerá conectada

### Passo 7.3: Testar publicação
1. Crie um post em `/create-post`
2. Faça upload de uma imagem
3. Selecione a conta Instagram conectada
4. Salve e aprove o post
5. Clique **"Publicar Agora"**
6. Verifique seu Instagram — o post deve aparecer!

---

## 8. Erros Comuns e Soluções

### Erro: "URL de redirecionamento inválida"
**Causa**: A URL no Facebook não corresponde exatamente à usada no app
**Solução**: Verifique se a URL no Facebook Developer é EXATAMENTE:
```
http://localhost:3000/api/social/callback/instagram
```
Incluindo `http` (não `https`) e a porta `3000`.

### Erro: "App não configurado para Instagram"
**Causa**: Não adicionou o produto "API Graph do Instagram"
**Solução**: Vá no painel e clique em "Configurar" no Instagram Graph API

### Erro: "Página não encontrada"
**Causa**: Não há página do Facebook com Instagram Business vinculado
**Solução**: Siga o Passo 5 deste guia

### Erro: "Token expirado"
**Causa**: Token de curta duração (1 hora)
**Solução**: O app troca automaticamente por token de página (60 dias). Se expirar, reconecte.

---

## 9. Variáveis de Ambiente Finais

Seu `.env` deve ficar assim:

```env
# Facebook / Instagram
META_APP_ID=seu-app-id-aqui
META_APP_SECRET=seu-app-secret-aqui

# LinkedIn (opcional)
# LINKEDIN_CLIENT_ID=...
# LINKEDIN_CLIENT_SECRET=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=dglewfrb9
CLOUDINARY_API_KEY=[REDACTED]
CLOUDINARY_API_SECRET=[REDACTED]

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=[REDACTED]
TWILIO_WHATSAPP_NUMBER=+14155238886

# Resend
RESEND_API_KEY=[REDACTED]
FROM_EMAIL=onboarding@resend.dev

# Outros
CRON_SECRET=social-pilot-cron-secret-2024-change-me
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Próximos Passos

1. [ ] Criar app no Facebook Developer
2. [ ] Adicionar Facebook Login
3. [ ] Configurar URLs de redirecionamento
4. [ ] Adicionar Instagram Graph API
5. [ ] Copiar App ID e App Secret para `.env`
6. [ ] Criar página do Facebook (se não tiver)
7. [ ] Vincular Instagram Business à página
8. [ ] Testar conexão no app
9. [ ] Publicar um post de teste

---

**Dúvidas?** Me mostre em qual passo você está e te ajudo!
