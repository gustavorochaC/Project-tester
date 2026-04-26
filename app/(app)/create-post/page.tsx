"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wand2,
  Loader2,
  Save,
  RefreshCw,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { postTypeLabels } from "@/lib/mock-data";

export default function CreatePostPage() {
  const router = useRouter();
  const [type, setType] = useState("educacao");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("12:00");
  const [loading, setLoading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [warning, setWarning] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/social/accounts")
      .then((res) => res.json())
      .then((data) => setSocialAccounts(data));
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedPost(null);
    setWarning("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, topic, date, time }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao gerar post");
      }

      const data = await res.json();
      setGeneratedPost(data);
      if (data.warning) setWarning(data.warning);
      toast.success("Post gerado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar post");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPost) return;

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedPost.title,
          content: generatedPost.content,
          hashtags: JSON.stringify(generatedPost.hashtags),
          type: generatedPost.type,
          status: "pendente",
          date: generatedPost.date,
          time: generatedPost.time,
          image: imageUrl,
          socialAccountIds: JSON.stringify(selectedAccounts),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar post");
      }

      toast.success("Post salvo com sucesso!");
      router.push("/pending");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar post");
    }
  };

  const handleApproveAndSave = async () => {
    if (!generatedPost) return;

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedPost.title,
          content: generatedPost.content,
          hashtags: JSON.stringify(generatedPost.hashtags),
          type: generatedPost.type,
          status: "aprovado",
          date: generatedPost.date,
          time: generatedPost.time,
          image: imageUrl,
          socialAccountIds: JSON.stringify(selectedAccounts),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar post");
      }

      toast.success("Post aprovado e salvo!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar post");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gerar Post com IA</h2>
        <p className="text-muted-foreground">
          Deixe a inteligencia artificial criar conteudo personalizado para voce
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left side - Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Configuracoes do Post
            </CardTitle>
            <CardDescription>
              Defina o tipo e detalhes para gerar o conteudo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Post</Label>
              <Select value={type} onValueChange={(v) => setType(v || "educacao")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(postTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tema ou Topico (opcional)</Label>
              <Input
                placeholder="Ex: promocao de hamburgers, dia das maes..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para tema automatico baseado no seu perfil
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Data
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Hora
                </Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagem do Post</Label>
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImageFile(file);
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: formData });
                  const data = await res.json();
                  if (data.url) setImageUrl(data.url);
                }}
              />
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded" />
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando com IA...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Gerar Post
                </>
              )}
            </Button>

            {warning && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-600">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {warning}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right side - Preview */}
        <Card className={generatedPost ? "" : "opacity-50"}>
          <CardHeader>
            <CardTitle>Preview do Post</CardTitle>
            <CardDescription>
              {generatedPost
                ? "Revise o conteudo gerado antes de salvar"
                : "O preview aparecera aqui apos gerar"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedPost ? (
              <>
                <div className="space-y-2">
                  <Label>Titulo</Label>
                  <Input
                    value={generatedPost.title}
                    onChange={(e) =>
                      setGeneratedPost({ ...generatedPost, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteudo</Label>
                  <Textarea
                    value={generatedPost.content}
                    onChange={(e) =>
                      setGeneratedPost({
                        ...generatedPost,
                        content: e.target.value,
                      })
                    }
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hashtags</Label>
                  <div className="flex flex-wrap gap-2">
                    {generatedPost.hashtags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Publicar em:</Label>
                  <div className="flex flex-wrap gap-2">
                    {socialAccounts.map((account: any) => (
                      <label key={account.id} className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAccounts([...selectedAccounts, account.id]);
                            } else {
                              setSelectedAccounts(selectedAccounts.filter((id) => id !== account.id));
                            }
                          }}
                        />
                        <span className="text-sm">{account.platform} — {account.accountName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(generatedPost.date).toLocaleDateString("pt-BR")} as{" "}
                  {generatedPost.time}
                  <Badge variant="outline" className="ml-2">
                    {postTypeLabels[generatedPost.type as keyof typeof postTypeLabels]}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} variant="outline" className="flex-1 gap-2">
                    <Save className="h-4 w-4" />
                    Salvar como Pendente
                  </Button>
                  <Button onClick={handleApproveAndSave} className="flex-1 gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Aprovar e Salvar
                  </Button>
                </div>

                <Button
                  onClick={handleGenerate}
                  variant="ghost"
                  disabled={loading}
                  className="w-full gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Gerar Novamente
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Wand2 className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">Nenhum post gerado ainda</p>
                <p className="text-sm">
                  Configure as opcoes e clique em "Gerar Post"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
