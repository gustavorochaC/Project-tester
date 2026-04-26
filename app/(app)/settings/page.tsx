"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { planLabels, planPrices } from "@/lib/mock-data";

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
          Gerencie as informacoes da sua empresa e plano
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
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
                <div className="space-y-2">
                  <Label>WhatsApp (para notificacoes)</Label>
                  <Input
                    value={profile?.whatsapp || ""}
                    onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email de Notificacao</Label>
                  <Input
                    value={profile?.notificationEmail || ""}
                    onChange={(e) => setProfile({ ...profile, notificationEmail: e.target.value })}
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
