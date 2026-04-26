"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function SelectOrganizationInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const personId = searchParams.get("personId");
  const expiresAt = searchParams.get("expiresAt");
  const refreshToken = searchParams.get("refreshToken");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/social/organizations?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        setOrgs(data);
        setLoading(false);
      });
  }, [token]);

  const handleSelect = async (org: any) => {
    await fetch("/api/social/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "linkedin",
        accountId: `urn:li:organization:${org.id}`,
        accountName: org.name,
        accessToken: token,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        refreshToken: refreshToken || null,
      }),
    });

    toast.success("LinkedIn conectado com sucesso!");
    router.push("/integrations?connected=true");
  };

  const handleUsePersonal = async () => {
    await fetch("/api/social/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "linkedin",
        accountId: personId,
        accountName: "Perfil Pessoal",
        accessToken: token,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        refreshToken: refreshToken || null,
      }),
    });

    toast.success("LinkedIn conectado com sucesso!");
    router.push("/integrations?connected=true");
  };

  if (loading) return <div className="max-w-2xl mx-auto py-12">Carregando organizacoes...</div>;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Escolha a organizacao do LinkedIn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orgs.map((org) => (
            <div key={org.id} className="flex items-center justify-between border p-4 rounded">
              <div>
                <p className="font-medium">{org.name}</p>
              </div>
              <Button onClick={() => handleSelect(org)}>Selecionar</Button>
            </div>
          ))}
          <div className="flex items-center justify-between border p-4 rounded">
            <div>
              <p className="font-medium">Perfil Pessoal</p>
            </div>
            <Button variant="outline" onClick={handleUsePersonal}>Usar Pessoal</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SelectOrganizationPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-12">Carregando...</div>}>
      <SelectOrganizationInner />
    </Suspense>
  );
}
