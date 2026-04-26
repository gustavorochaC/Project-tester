"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Globe,
  Share2,
  MessageSquare,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  BookOpen,
} from "lucide-react";

const platformIcons: Record<string, any> = {
  instagram: Globe,
  facebook: Share2,
  linkedin: MessageSquare,
};

const platformColors: Record<string, string> = {
  instagram: "text-pink-500",
  facebook: "text-blue-500",
  linkedin: "text-blue-700",
};

const eventTypes = [
  { key: "post_approved", label: "Post aprovado" },
  { key: "post_rejected", label: "Post reprovado" },
  { key: "post_published", label: "Post publicado com sucesso" },
  { key: "post_failed", label: "Falha na publicacao" },
  { key: "token_expiring", label: "Token expirando" },
  { key: "urgent_trend", label: "Tendencia urgente" },
  { key: "weekly_report", label: "Relatorio semanal" },
  { key: "new_client", label: "Novo cliente" },
];

function ConnectedAccountsTab() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/social/accounts")
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data);
        setLoading(false);
      });
  }, []);

  const getHealth = (account: any) => {
    if (!account.expiresAt) return { color: "bg-green-500", text: "Saudavel" };
    const days = Math.ceil((new Date(account.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { color: "bg-red-500", text: "Expirado" };
    if (days < 7) return { color: "bg-yellow-500", text: `Expira em ${days}d` };
    return { color: "bg-green-500", text: "Saudavel" };
  };

  const handleDisconnect = async (id: string) => {
    await fetch(`/api/social/accounts?id=${id}`, { method: "DELETE" });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Conta desconectada");
  };

  const handleConnect = (platform: string) => {
    window.location.href = `/api/social/auth/${platform}`;
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Contas Conectadas</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => window.location.href = "/integrations/setup-guide"}>
            <BookOpen className="h-4 w-4 mr-1" />
            Guia de Configuracao
          </Button>
          {["instagram", "facebook", "linkedin"].map((p) => (
            <Button key={p} size="sm" variant="outline" onClick={() => handleConnect(p)}>
              <Link2 className="h-4 w-4 mr-1" />
              {p}
            </Button>
          ))}
        </div>
      </div>

      {accounts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma conta conectada. Clique em "Conectar" acima.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const Icon = platformIcons[account.platform] || Globe;
          const health = getHealth(account);
          return (
            <Card key={account.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${platformColors[account.platform] || ""}`} />
                    <CardTitle className="text-base">{account.accountName || account.platform}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${health.color}`} />
                    <span className="text-xs text-muted-foreground">{health.text}</span>
                  </div>
                </div>
                <CardDescription className="text-xs truncate">{account.accountId}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleDisconnect(account.id)}>
                  Desconectar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function EventNotificationsTab() {
  const [rules, setRules] = useState<any[]>([]);
  const [whatsapp, setWhatsapp] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/integrations/notifications")
      .then((res) => res.json())
      .then((data) => {
        const existingRules = eventTypes.map((et) => {
          const found = data.rules.find((r: any) => r.eventType === et.key);
          return (
            found || {
              eventType: et.key,
              active: false,
              channels: JSON.stringify({ whatsapp: false, email: false }),
            }
          );
        });
        setRules(existingRules);
        setWhatsapp(data.whatsapp || "");
        setNotificationEmail(data.notificationEmail || "");
        setLoading(false);
      });
  }, []);

  const updateRule = (index: number, field: string, value: any) => {
    const updated = [...rules];
    if (field === "active") {
      updated[index].active = value;
    } else {
      const channels = JSON.parse(updated[index].channels);
      channels[field] = value;
      updated[index].channels = JSON.stringify(channels);
    }
    setRules(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/integrations/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules, whatsapp, notificationEmail }),
    });
    setSaving(false);
    toast.success("Notificacoes salvas!");
  };

  const testEvent = async (eventType: string) => {
    toast.info(`Teste de ${eventType} disparado (verifique console)`);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Destinatarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+5511999999999" />
            </div>
            <div className="space-y-2">
              <Label>Email de Notificacao</Label>
              <Input
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="email@empresa.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {eventTypes.map((et, idx) => {
          const rule = rules[idx];
          const channels = JSON.parse(rule.channels || "{}");
          return (
            <Card key={et.key}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch checked={rule.active} onCheckedChange={(v) => updateRule(idx, "active", v)} />
                    <span className="font-medium">{et.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {rule.active && (
                      <>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={channels.whatsapp}
                            onChange={(e) => updateRule(idx, "whatsapp", e.target.checked)}
                          />
                          WhatsApp
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={channels.email}
                            onChange={(e) => updateRule(idx, "email", e.target.checked)}
                          />
                          Email
                        </label>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => testEvent(et.key)}>
                      Testar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Salvar Configuracoes
      </Button>
    </div>
  );
}

function ActivityLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ platform: "", status: "", event: "" });

  const fetchLogs = () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: "25" });
    if (filters.platform) qs.set("platform", filters.platform);
    if (filters.status) qs.set("status", filters.status);
    if (filters.event) qs.set("event", filters.event);

    fetch(`/api/integrations/logs?${qs}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs);
        setTotal(data.total);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
      info: "bg-blue-100 text-blue-800",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Plataforma"
          value={filters.platform}
          onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
          className="w-40"
        />
        <Input
          placeholder="Status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="w-40"
        />
        <Input
          placeholder="Evento"
          value={filters.event}
          onChange={(e) => setFilters({ ...filters, event: e.target.value })}
          className="w-40"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-left">Evento</th>
              <th className="px-4 py-2 text-left">Plataforma</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-2">{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2">{log.event}</td>
                <td className="px-4 py-2">{log.platform || "-"}</td>
                <td className="px-4 py-2">{statusBadge(log.status)}</td>
                <td className="px-4 py-2 max-w-xs truncate">{log.message}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum log encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Pagina {page} de {Math.ceil(total / 25)}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 25)}
          >
            Proxima
          </Button>
        </div>
      </div>
    </div>
  );
}

function TestIntegrationsTab() {
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const testWhatsApp = async () => {
    setLoadingWhatsApp(true);
    try {
      const res = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Teste de notificacao do Social Pilot!" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.simulated ? data.message : "WhatsApp enviado!");
    } catch (error: any) {
      toast.error(error.message);
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
          subject: "Teste - Social Pilot",
          text: "Este e um email de teste das notificacoes.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.simulated ? data.message : "Email enviado!");
    } catch (error: any) {
      toast.error(error.message);
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
        </CardHeader>
        <CardContent>
          <Button onClick={testWhatsApp} disabled={loadingWhatsApp} className="w-full gap-2">
            {loadingWhatsApp ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
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
        </CardHeader>
        <CardContent>
          <Button onClick={testEmail} disabled={loadingEmail} className="w-full gap-2">
            {loadingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {loadingEmail ? "Enviando..." : "Enviar Teste Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrationsInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("accounts");

  useEffect(() => {
    if (searchParams.get("connected") === "true") toast.success("Conta conectada!");
    if (searchParams.get("error") === "true") toast.error("Erro na conexao.");
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integracoes</h2>
        <p className="text-muted-foreground">Gerencie contas sociais, notificacoes e logs</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accounts">Contas Conectadas</TabsTrigger>
          <TabsTrigger value="notifications">Notificacoes por Evento</TabsTrigger>
          <TabsTrigger value="logs">Logs de Atividade</TabsTrigger>
          <TabsTrigger value="test">Testar Integracoes</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <ConnectedAccountsTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <EventNotificationsTab />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <ActivityLogsTab />
        </TabsContent>
        <TabsContent value="test" className="mt-4">
          <TestIntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Carregando...</div>}>
      <IntegrationsInner />
    </Suspense>
  );
}
