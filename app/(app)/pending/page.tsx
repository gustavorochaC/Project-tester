"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Edit3, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { statusColors, statusLabels, postTypeLabels } from "@/lib/mock-data";

interface Post {
  id: string;
  title: string;
  content: string;
  hashtags: string;
  type: string;
  status: string;
  date: string;
  time: string;
}

export default function PendingPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch("/api/posts?status=pendente")
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }, []);

  const handleApprove = async (id: string) => {
    await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "aprovado" }),
    });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Post aprovado com sucesso!");
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "reprovado" }),
    });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.error("Post reprovado");
  };

  const handleRequestEdit = async (id: string) => {
    if (editingPost === id) {
      await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pendente" }),
      });
      setEditingPost(null);
      setFeedback("");
      toast.success("Post enviado para ajuste");
    } else {
      setEditingPost(id);
    }
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
        <h2 className="text-3xl font-bold tracking-tight">Posts Pendentes</h2>
        <p className="text-muted-foreground">
          Revise e aprove os posts gerados pela IA
        </p>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[post.status as keyof typeof statusColors]}>
                      {statusLabels[post.status as keyof typeof statusLabels]}
                    </Badge>
                    <Badge variant="outline">{postTypeLabels[post.type as keyof typeof postTypeLabels]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.date).toLocaleDateString("pt-BR")} as {post.time}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm">{post.content}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {parseHashtags(post.hashtags).map((tag) => (
                    <span key={tag} className="text-xs text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {editingPost === post.id && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Descreva o que deseja alterar..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(post.id)}
                  className="gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(post.id)}
                  className="gap-1"
                >
                  <XCircle className="h-4 w-4" />
                  Reprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRequestEdit(post.id)}
                  className="gap-1"
                >
                  {editingPost === post.id ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : (
                    <Edit3 className="h-4 w-4" />
                  )}
                  {editingPost === post.id ? "Enviar Ajuste" : "Pedir Ajuste"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {posts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Tudo em ordem!</p>
              <p className="text-sm text-muted-foreground">
                Nenhum post pendente de aprovacao
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
