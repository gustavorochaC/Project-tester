"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function SelectPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const platform = searchParams.get("platform");
  const token = searchParams.get("token");
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/social/pages?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        setPages(data);
        setLoading(false);
      });
  }, [token]);

  const handleSelect = async (page: any) => {
    const igAccount = page.instagram_business_account;
    const isInstagram = platform === "instagram";

    const accountId = isInstagram ? igAccount?.id : page.id;
    const accountName = isInstagram ? igAccount?.username : page.name;

    if (isInstagram && !igAccount) {
      toast.error("Esta pagina nao tem uma conta Instagram Business vinculada.");
      return;
    }

    await fetch("/api/social/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, accountId, accountName, accessToken: token }),
    });

    toast.success(`${platform} conectado com sucesso!`);
    router.push("/integrations?connected=true");
  };

  if (loading) return <div className="max-w-2xl mx-auto py-12">Carregando paginas...</div>;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Escolha a pagina para conectar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between border p-4 rounded">
              <div>
                <p className="font-medium">{page.name}</p>
                {page.instagram_business_account && (
                  <p className="text-sm text-muted-foreground">
                    Instagram: @{page.instagram_business_account.username}
                  </p>
                )}
              </div>
              <Button onClick={() => handleSelect(page)}>Selecionar</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SelectPagePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-12">Carregando...</div>}>
      <SelectPageInner />
    </Suspense>
  );
}
