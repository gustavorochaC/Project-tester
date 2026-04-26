"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BookOpen, CheckCircle, AlertTriangle, Copy } from "lucide-react";

const steps = [
  {
    title: "1. Criar app no Facebook Developer",
    description: "Acesse developers.facebook.com/apps e clique em 'Criar aplicativo'",
    detail: "Escolha 'Outro' → 'Empresa' → Preencha nome e email",
  },
  {
    title: "2. Adicionar Facebook Login",
    description: "No painel do app, clique em 'Configurar' no produto 'Login do Facebook'",
    detail: "Isso habilita o OAuth para seu app",
  },
  {
    title: "3. Configurar URLs de redirecionamento",
    description: "Vá em: Login do Facebook → Configurações",
    detail: "Adicione exatamente estas URLs (uma por linha):",
    code: "http://localhost:3000/api/social/callback/facebook\nhttp://localhost:3000/api/social/callback/instagram",
  },
  {
    title: "4. Adicionar Instagram Graph API",
    description: "No painel, clique em 'Configurar' no produto 'API Graph do Instagram'",
    detail: "Isso habilita a publicação no Instagram",
  },
  {
    title: "5. Copiar App ID e App Secret",
    description: "Vá em: Configurações → Básico",
    detail: "Copie os dois valores e cole no arquivo .env do projeto",
    code: "META_APP_ID=seu-app-id\nMETA_APP_SECRET=seu-app-secret",
  },
  {
    title: "6. Criar Página do Facebook (se não tiver)",
    description: "Vá para facebook.com/pages/create",
    detail: "O Instagram Business deve estar vinculado a uma página do Facebook",
  },
  {
    title: "7. Vincular Instagram à Página",
    description: "Na página do Facebook: Configurações → Instagram",
    detail: "Conecte sua conta Instagram Business",
  },
  {
    title: "8. Testar no Social Pilot",
    description: "Volte para /integrations e clique em 'Conectar instagram'",
    detail: "Autorize o app e selecione a página com Instagram vinculado",
  },
];

export default function FacebookSetupGuidePage() {
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSaveCredentials = async () => {
    if (!appId || !appSecret) {
      toast.error("Preencha App ID e App Secret");
      return;
    }
    // Aqui idealmente salvaríamos no servidor, mas por segurança
    // vamos apenas mostrar como colocar no .env
    toast.success("Credenciais recebidas! Cole no arquivo .env");
    setSaved(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurar Facebook/Instagram</h2>
        <p className="text-muted-foreground">
          Siga o passo a passo para conectar seu Instagram Business
        </p>
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Importante</p>
              <p className="text-sm text-yellow-700">
                Você precisa ter uma conta Instagram <strong>Business</strong> vinculada a uma 
                página do Facebook. Contas pessoais não funcionam com a API.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{step.description}</p>
              <p className="text-xs text-muted-foreground">{step.detail}</p>
              {step.code && (
                <div className="relative">
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    <code>{step.code}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => copyToClipboard(step.code!)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Cole as credenciais no .env
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>App ID do Facebook</Label>
              <Input
                placeholder="123456789012345"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>App Secret</Label>
              <Input
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-muted p-4 rounded-md space-y-2">
            <p className="text-sm font-medium">Seu arquivo .env deve ter:</p>
            <pre className="text-xs overflow-x-auto">
              <code>
                {`META_APP_ID=${appId || "seu-app-id"}
META_APP_SECRET=${appSecret || "seu-app-secret"}`}
              </code>
            </pre>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveCredentials} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Confirmar e Copiar
            </Button>
            <Button variant="outline" onClick={() => window.open("https://developers.facebook.com/apps", "_blank")}>
              Abrir Facebook Developer
            </Button>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-md">
              <p className="text-sm text-green-800 font-medium">Próximo passo:</p>
              <p className="text-sm text-green-700">
                1. Abra o arquivo <code>.env</code> na raiz do projeto
                <br />
                2. Substitua META_APP_ID e META_APP_SECRET pelos valores acima
                <br />
                3. Reinicie o servidor: <code>npm run dev</code>
                <br />
                4. Volte para <a href="/integrations" className="underline">Integrações</a> e teste!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
