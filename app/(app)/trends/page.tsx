"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { urgencyColors, urgencyLabels } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Trend {
  id: string;
  title: string;
  description: string;
  urgency: string;
  suggestedPost: string;
  hashtags: string;
  expiresIn: string;
  niche: string;
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);

  useEffect(() => {
    fetch("/api/trends")
      .then((res) => res.json())
      .then((data) => setTrends(data));
  }, []);

  const handleApprove = async (id: string) => {
    await fetch(`/api/trends/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    setTrends((prev) => prev.filter((t) => t.id !== id));
    toast.success("Post de tendencia aprovado! Sera publicado em breve.");
  };

  const parseHashtags = (hashtags: string) => {
    try {
      return JSON.parse(hashtags) as string[];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Radar de Tendencias</h2>
        <p className="text-muted-foreground">
          Oportunidades detectadas em tempo real pelo nosso radar
        </p>
      </div>

      <div className="grid gap-4">
        {trends.map((trend) => (
          <Card
            key={trend.id}
            className={cn(
              "border-l-4",
              trend.urgency === "alta"
                ? "border-l-red-500"
                : trend.urgency === "media"
                ? "border-l-yellow-500"
                : "border-l-green-500"
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{trend.title}</CardTitle>
                    <Badge variant="outline" className={urgencyColors[trend.urgency as keyof typeof urgencyColors]}>
                      {urgencyLabels[trend.urgency as keyof typeof urgencyLabels]}
                    </Badge>
                  </div>
                  <CardDescription>{trend.description}</CardDescription>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Expira em {trend.expiresIn}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm font-medium mb-2">Post sugerido:</p>
                <p className="text-sm">{trend.suggestedPost}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {parseHashtags(trend.hashtags).map((tag) => (
                    <span key={tag} className="text-xs text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Nicho: {trend.niche}
                </span>
                <Button
                  size="sm"
                  onClick={() => handleApprove(trend.id)}
                  className="gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprovar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="flex items-center gap-4 py-6">
          <Zap className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="font-medium">Dica do radar</p>
            <p className="text-sm text-muted-foreground">
              Posts de alta urgencia tem janela de 24-48 horas. Aproveite antes que a tendencia passe!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
