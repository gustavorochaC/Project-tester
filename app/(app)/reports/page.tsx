"use client";

import { useState } from "react";
import { TrendingUp, Users, Eye, Heart, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { statusLabels, postTypeLabels } from "@/lib/mock-data";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/reports/export");
      if (!res.ok) throw new Error("Erro ao buscar dados");
      const data = await res.json();

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.text("Relatorio Social Pilot", pageWidth / 2, 20, { align: "center" });
      doc.setFontSize(10);
      doc.text(
        `Gerado em: ${new Date(data.generatedAt).toLocaleDateString("pt-BR")}`,
        pageWidth / 2,
        28,
        { align: "center" }
      );

      // Summary
      doc.setFontSize(14);
      doc.text("Resumo", 14, 45);
      doc.setFontSize(10);
      doc.text(`Total de Posts: ${data.summary.totalPosts}`, 14, 55);
      doc.text(`Aprovados: ${data.summary.approvedPosts}`, 14, 62);
      doc.text(`Pendentes: ${data.summary.pendingPosts}`, 14, 69);
      doc.text(`Publicados: ${data.summary.publishedPosts}`, 14, 76);
      doc.text(`Engajamento Medio: ${data.summary.avgEngagement}`, 14, 83);
      doc.text(`Total de Clientes: ${data.summary.totalClients}`, 14, 90);

      // Top Posts
      if (data.topPosts.length > 0) {
        doc.setFontSize(14);
        doc.text("Posts Mais Performaticos", 14, 105);

        autoTable(doc, {
          startY: 110,
          head: [["#", "Titulo", "Tipo", "Engajamento"]],
          body: data.topPosts.map((post: any, i: number) => [
            i + 1,
            post.title,
            postTypeLabels[post.type as keyof typeof postTypeLabels] || post.type,
            post.engagement,
          ]),
          theme: "grid",
          headStyles: { fillColor: [99, 102, 241] },
        });
      }

      // All Posts
      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      doc.setFontSize(14);
      doc.text("Todos os Posts", 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [["Titulo", "Tipo", "Status", "Data", "Engajamento"]],
        body: data.posts.map((post: any) => [
          post.title,
          postTypeLabels[post.type as keyof typeof postTypeLabels] || post.type,
          statusLabels[post.status as keyof typeof statusLabels] || post.status,
          new Date(post.date).toLocaleDateString("pt-BR"),
          post.engagement || 0,
        ]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      doc.save(`relatorio-social-pilot-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao exportar PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Relatorio Mensal</h2>
        <p className="text-muted-foreground">
          Resumo de performance de abril de 2025
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">+5 vs marco</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcance Total</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5K</div>
            <p className="text-xs text-muted-foreground">+23% vs marco</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">109</div>
            <p className="text-xs text-muted-foreground">Media por post</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Seguidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+342</div>
            <p className="text-xs text-muted-foreground">+18% vs marco</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts Mais Performaticos</CardTitle>
          <CardDescription>Top posts com maior engajamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "4", title: "O que nossos clientes estao dizendo", type: "depoimento", status: "publicado", engagement: 512 },
            { id: "1", title: "5 dicas para um hamburger perfeito em casa", type: "educacao", status: "aprovado", engagement: 245 },
            { id: "6", title: "Novo burger do mes: Truffle Supreme", type: "promocao", status: "aprovado", engagement: 0 },
          ].map((post, index) => (
            <div
              key={post.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{postTypeLabels[post.type as keyof typeof postTypeLabels]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {statusLabels[post.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{post.engagement}</p>
                <p className="text-xs text-muted-foreground">interacoes</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExportPDF} disabled={exporting} className="gap-2">
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exporting ? "Exportando..." : "Exportar PDF"}
        </Button>
      </div>
    </div>
  );
}
