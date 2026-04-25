"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Sparkles, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Sobre o Negocio", description: "Conte-nos sobre sua empresa" },
  { id: 2, title: "Publico-Alvo", description: "Quem voce quer alcancar" },
  { id: 3, title: "Tom de Voz", description: "Como sua marca se expressa" },
  { id: 4, title: "Objetivos", description: "O que voce quer conquistar" },
  { id: 5, title: "Redes Sociais", description: "Onde voce quer estar presente" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    companyName: "",
    segment: "",
    description: "",
    city: "",
    targetAge: "",
    targetGender: "",
    voice: "",
    words: "",
    avoidWords: "",
    objectives: "",
    frequency: "",
    instagram: false,
    facebook: false,
    linkedin: false,
    whatsapp: "",
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateField = (field: string, value: string | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value ?? "" }));
  };

  const generatePreview = () => {
    const previews = [
      `Descubra o sabor autentico da ${formData.companyName || "sua empresa"}! Nosso compromisso e com a qualidade e a satisfacao dos nossos clientes.`,
      `Na ${formData.companyName || "sua empresa"}, cada detalhe e pensado para oferecer a melhor experiencia. Venha conhecer!`,
      `${formData.companyName || "Sua empresa"}: onde tradicao e inovacao se encontram para criar momentos inesqueciveis.`,
    ];
    return previews[currentStep % previews.length];
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.success("Onboarding completo! Seu calendario esta sendo gerado...");
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center border-b border-border px-6">
          <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Social Pilot</span>
          </div>
        </div>

        <div className="flex-1 px-8 py-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8">
              <Progress value={progress} className="mb-4" />
              <div className="flex justify-between text-sm text-muted-foreground">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center ${
                      index <= currentStep ? "text-primary" : ""
                    }`}
                  >
                    <span className="font-medium">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">{steps[currentStep].title}</h1>
                <p className="text-muted-foreground">{steps[currentStep].description}</p>
              </div>

              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Empresa</Label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      placeholder="Ex: Burger House"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Segmento</Label>
                    <Select
                      value={formData.segment}
                      onValueChange={(v) => updateField("segment", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alimentacao">Alimentacao</SelectItem>
                        <SelectItem value="saude">Saude</SelectItem>
                        <SelectItem value="varejo">Varejo</SelectItem>
                        <SelectItem value="servicos">Servicos</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descricao dos Produtos/Servicos</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Descreva o que sua empresa oferece..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade/Regiao</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="Ex: Sao Paulo, SP"
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Faixa Etaria</Label>
                    <Select
                      value={formData.targetAge}
                      onValueChange={(v) => updateField("targetAge", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-25">18-25 anos</SelectItem>
                        <SelectItem value="26-35">26-35 anos</SelectItem>
                        <SelectItem value="36-45">36-45 anos</SelectItem>
                        <SelectItem value="46+">46+ anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Genero Predominante</Label>
                    <Select
                      value={formData.targetGender}
                      onValueChange={(v) => updateField("targetGender", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tom de Voz Desejado</Label>
                    <Select
                      value={formData.voice}
                      onValueChange={(v) => updateField("voice", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="descontraido">Descontraido</SelectItem>
                        <SelectItem value="tecnico">Tecnico</SelectItem>
                        <SelectItem value="inspiracional">Inspiracional</SelectItem>
                        <SelectItem value="humoristico">Humoristico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Palavras que Gosta de Usar</Label>
                    <Textarea
                      value={formData.words}
                      onChange={(e) => updateField("words", e.target.value)}
                      placeholder="Ex: artesanal, exclusivo, premium..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Palavras para Evitar</Label>
                    <Textarea
                      value={formData.avoidWords}
                      onChange={(e) => updateField("avoidWords", e.target.value)}
                      placeholder="Ex: barato, simples, basico..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Principais Objetivos</Label>
                    <Select
                      value={formData.objectives}
                      onValueChange={(v) => updateField("objectives", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seguidores">Mais Seguidores</SelectItem>
                        <SelectItem value="vendas">Mais Vendas</SelectItem>
                        <SelectItem value="autoridade">Autoridade no Nicho</SelectItem>
                        <SelectItem value="todos">Todos os Anteriores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequencia de Posts por Semana</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(v) => updateField("frequency", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 posts</SelectItem>
                        <SelectItem value="5">5 posts</SelectItem>
                        <SelectItem value="7">7 posts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Redes Sociais</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span>Instagram</span>
                        <Button
                          variant={formData.instagram ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateField("instagram", !formData.instagram)}
                        >
                          {formData.instagram ? "Conectado" : "Conectar"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span>Facebook</span>
                        <Button
                          variant={formData.facebook ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateField("facebook", !formData.facebook)}
                        >
                          {formData.facebook ? "Conectado" : "Conectar"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span>LinkedIn</span>
                        <Button
                          variant={formData.linkedin ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateField("linkedin", !formData.linkedin)}
                        >
                          {formData.linkedin ? "Conectado" : "Conectar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp para Notificacoes</Label>
                    <Input
                      value={formData.whatsapp}
                      onChange={(e) => updateField("whatsapp", e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={handleNext}>
                  {currentStep === steps.length - 1 ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Finalizar
                    </>
                  ) : (
                    <>
                      Proximo
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Preview */}
      <div className="hidden w-[400px] border-l border-border bg-muted/30 p-8 lg:flex lg:flex-col">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Preview do Perfil</h3>
          <p className="text-sm text-muted-foreground">
            Veja como sua marca esta sendo construida
          </p>
        </div>

        <Card className="flex-1">
          <CardContent className="space-y-6 pt-6">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-primary">
                  {formData.companyName.charAt(0) || "?"}
                </span>
              </div>
              <h4 className="font-semibold">
                {formData.companyName || "Sua Empresa"}
              </h4>
              <Badge variant="outline" className="mt-1">
                {formData.segment || "Segmento"}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground mb-1">Tom de Voz</p>
                <p className="text-sm font-medium capitalize">
                  {formData.voice || "Nao definido"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground mb-1">Publico-Alvo</p>
                <p className="text-sm font-medium">
                  {formData.targetAge || "Nao definido"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground mb-1">Frequencia</p>
                <p className="text-sm font-medium">
                  {formData.frequency ? `${formData.frequency} posts/semana` : "Nao definido"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs text-primary mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Exemplo de Post
              </p>
              <p className="text-sm italic">"{generatePreview()}"</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
