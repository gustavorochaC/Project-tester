import { Users, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planLabels } from "@/lib/mock-data";

async function getClients() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/clients`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch clients");
  return res.json();
}

export default async function AgencyPage() {
  const clients = await getClients();

  const totalPosts = clients.reduce((acc: number, c: any) => acc + c.postsThisMonth, 0);
  const totalPending = clients.reduce((acc: number, c: any) => acc + c.pendingPosts, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Painel da Agencia</h2>
          <p className="text-muted-foreground">
            Gerencie todos os seus clientes em um so lugar
          </p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecionar cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map((client: any) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Ativos este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts do Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <p className="text-xs text-muted-foreground">Todos os clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovacao</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {clients.map((client: any) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>{client.segment}</CardDescription>
                </div>
                <Badge variant="outline">{planLabels[client.plan as keyof typeof planLabels]}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-sm text-muted-foreground">Posts do Mes</p>
                  <p className="text-xl font-bold">{client.postsThisMonth}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-xl font-bold">{client.pendingPosts}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="text-xl font-bold">{planLabels[client.plan as keyof typeof planLabels]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
