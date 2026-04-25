import Link from "next/link";
import { Calendar, Clock, TrendingUp, CheckCircle, Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublishNowButton } from "@/components/publish-now-button";
import { statusColors, statusLabels, postTypeLabels } from "@/lib/mock-data";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const data = await getDashboardData();

  const totalPosts = data.totalPosts;
  const pendingPosts = data.pendingPosts;
  const approvedPosts = data.approvedPosts;
  const nextPost = data.nextPost;
  const recentPosts = data.recentPosts || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bem-vindo de volta! Aqui esta o resumo da sua presenca digital.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts do Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <p className="text-xs text-muted-foreground">Total em abril</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPosts}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovacao</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedPosts}</div>
            <p className="text-xs text-muted-foreground">Prontos para publicar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.trendCount || 0}</div>
            <p className="text-xs text-muted-foreground">Oportunidades detectadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Posts Recentes</CardTitle>
            <CardDescription>Ultimos posts do seu calendario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPosts.map((post: any) => (
              <div
                key={post.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{post.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[post.status as keyof typeof statusColors]}>
                      {statusLabels[post.status as keyof typeof statusLabels]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {postTypeLabels[post.type as keyof typeof postTypeLabels]}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(post.date).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/pending">Ver todos os posts</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proximo Post</CardTitle>
            <CardDescription>Proximo post agendado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextPost ? (
              <>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    <span className="font-medium">{nextPost.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {nextPost.content.substring(0, 120)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={statusColors[nextPost.status as keyof typeof statusColors]}>
                      {statusLabels[nextPost.status as keyof typeof statusLabels]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(nextPost.date).toLocaleDateString("pt-BR")} as {nextPost.time}
                    </span>
                  </div>
                </div>
                <PublishNowButton postId={nextPost.id} />
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum post agendado
              </div>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/calendar">Ver calendario completo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
