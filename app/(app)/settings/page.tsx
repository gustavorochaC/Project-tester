"use client";

import { useState, useEffect } from "react";
import { Save, Globe, Share2, MessageSquare, MessageCircle, Mail, TrendingUp, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { planLabels, planPrices } from "@/lib/mock-data";

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string | null;
  connected: boolean;
}

function NotificationTestCards() {
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const testWhatsApp = async () => {
    setLoadingWhatsApp(true);
    try {
      const res = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Teste de notificacao do Social Pilot! Seu post foi aprovado e esta pronto para publicar.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.simulated) {
        toast.success(data.message);
      } else {
        toast.success("Mensagem WhatsApp enviada com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar WhatsApp");
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const testEmail = async () => {
    setLoadingEmail(true);
    try {
      const res = await fetch("/api/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "usuario@exemplo.com",
          subject: "Relatorio Semanal - Social Pilot",
          text: "Aqui esta o resumo semanal da sua presenca digital. Voce teve 7 posts este mes e um engajamento medio de 109 interacoes.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.simulated) {
        toast.success(data.message);
      } else {
        toast.success("Email enviado com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email");
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Testar WhatsApp
          </CardTitle>
          <CardDescription>
            Envie uma mensagem de teste para o numero configurado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testWhatsApp} disabled={loadingWhatsApp} className="w-full gap-2">
            {loadingWhatsApp ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            {loadingWhatsApp ? "Enviando..." : "Enviar Teste WhatsApp"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Testar Email
          </CardTitle>
          <CardDescription>
            Envie um email de teste com o relatorio semanal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testEmail} disabled={loadingEmail} className="w-full gap-2">
            {loadingEmail ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {loadingEmail ? "Enviando..." : "Enviar Teste Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SocialAccountsTab() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const platforms = [
    { key: "instagram", name: "Instagram", icon: Globe, color: "text-pink-500" },
    { key: "facebook", name: "Facebook", icon: Share2, color: "text-blue-500" },
    { key: "linkedin", name: "LinkedIn", icon: MessageSquare, color: "text-blue-700" },
  ];

  useEffect(() => {
    fetch("/api/social/accounts")
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isConnected = (platform: string) =>
    accounts.some((a) => a.platform === platform && a.connected);

  const getAccountName = (platform: string) =>
    accounts.find((a) => a.platform === platform)?.accountName || "";

  const getAccountId = (platform: string) =>
    accounts.find((a) => a.platform === platform)?.id || "";

  const handleConnect = (platform: string) => {
    window.location.href = `/api/social/auth/${platform}`;
  };

  const handleDisconnect = async (platform: string) => {
    const id = getAccountId(platform);
    if (!id) return;

    await fetch(`/api/social/accounts?id=${id}`, { method: "DELETE" });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} desconectado`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando contas...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes Sociais</CardTitle>
        <CardDescription>
          Conecte suas contas para publicacao automatica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map((platform) => {
          const connected = isConnected(platform.key);
          const Icon = platform.icon;
          return (
            <div
              key={platform.key}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${platform.color}`} />
                <div>
                  <p className="font-medium">{platform.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {connected
                      ? getAccountName(platform.key) || "Conectado"
                      : "Nao conectado"}
                  </p>
                </div>
              </div>
              {connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(platform.key)}
                >
                  Desconectar
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleConnect(platform.key)}
                >
                  Conectar
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    whatsapp: true,
    email: true,
    trends: true,
    weekly: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile);
        if (data.notifications) setNotifications(data.notifications);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, notifications }),
    });
    toast.success("Configuracoes salvas com sucesso!");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuracoes</h2>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuracoes</h2>
        <p className="text-muted-foreground">
          Gerencie seu perfil, redes sociais e preferencias
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="social">Redes Sociais</TabsTrigger>
          <TabsTrigger value="notifications">Notificacoes</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfil da Empresa</CardTitle>
              <CardDescription>
                Informacoes basicas do seu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={profile?.companyName || ""}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Segmento</Label>
                  <Input
                    value={profile?.segment || ""}
                    onChange={(e) => setProfile({ ...profile, segment: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={profile?.city || ""}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={profile?.website || ""}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descricao</Label>
                <Textarea
                  value={profile?.description || ""}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  rows={4}
                />
              </div>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alteracoes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <SocialAccountsTab />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificacoes</CardTitle>
              <CardDescription>
                Escolha como quer ser notificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas de tendencias e aprovacoes
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.whatsapp}
                  onCheckedChange={(v) =>
                    setNotifications({ ...notifications, whatsapp: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      Relatorios e resumos semanais
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(v) =>
                    setNotifications({ ...notifications, email: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Tendencias Urgentes</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando detectar tendencia de alta urgencia
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.trends}
                  onCheckedChange={(v) =>
                    setNotifications({ ...notifications, trends: v })
                  }
                />
              </div>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alteracoes
              </Button>
            </CardContent>
          </Card>

          <NotificationTestCards />
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>
                Gerencie sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-primary/50 bg-primary/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{planLabels[profile?.plan as keyof typeof planLabels] || "Pro"}</h3>
                    <p className="text-muted-foreground">{planPrices[profile?.plan as keyof typeof planPrices] || "R$ 397/mes"}</p>
                  </div>
                  <Badge>Plano Atual</Badge>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    3 redes sociais
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    30 posts por mes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Radar de tendencias
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Suporte via WhatsApp
                  </li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Alterar Plano</Button>
                <Button variant="destructive">Cancelar Assinatura</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
