"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PublishNowButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, platforms: ["instagram", "facebook", "linkedin"] }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao publicar");
      }

      const simulated = Object.values(data.results).some((r: any) => r.simulated);
      if (simulated) {
        toast.success("Post publicado (modo simulado)!");
      } else {
        toast.success("Post publicado com sucesso!");
      }

      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao publicar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      className="w-full gap-2"
      onClick={handlePublish}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
      {loading ? "Publicando..." : "Publicar Agora"}
    </Button>
  );
}
