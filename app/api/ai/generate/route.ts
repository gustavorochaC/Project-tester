import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

let genAI: any = null;
if (process.env.GOOGLE_AI_API_KEY) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
}

const postTypePrompts: Record<string, string> = {
  educacao:
    "Crie um post educativo que ensine algo relevante ao publico-alvo. Use dados, curiosidades ou dicas praticas.",
  promocao:
    "Crie um post promocional que destaque uma oferta, desconto ou lancamento. Crie senso de urgencia.",
  bastidores:
    "Crie um post mostrando os bastidores do negocio. Mostre o processo, a equipe ou o dia a dia.",
  depoimento:
    "Crie um post de depoimento ou caso de sucesso. Use tom autentico e confiavel.",
  curiosidade:
    "Crie um post com uma curiosidade interessante relacionada ao segmento. Engaje o publico com algo surpreendente.",
};

const fallbackTemplates: Record<string, string[]> = {
  educacao: [
    "Voce sabia que {topic}? Aqui na {company}, a gente vive isso no dia a dia. Quer aprender mais? Comenta aqui!",
    "5 dicas para melhorar seu {topic}: 1. Seja consistente 2. Invista em qualidade 3. Conheca seu publico 4. Inove sempre 5. Confie em quem entende do assunto. Qual voce ja coloca em pratica?",
    "Muita gente pergunta sobre {topic}. A verdade e que nao existe formula magica, mas existe estrategia. E a gente ta aqui pra ajudar!",
  ],
  promocao: [
    "Atençao, {company} fas! Promocao especial esta no ar: {offer}! So ate {deadline}. Nao perca!",
    "Essa voce nao pode perder! {offer} exclusivo aqui na {company}. Corre que e por tempo limitado!",
    "Lancamento especial na {company}! {offer}. Venha conhecer e aproveite!",
  ],
  bastidores: [
    "Bastidores da {company}! Esse e o nosso processo de {topic}. Cada detalhe e pensado com carinho para voce.",
    "Um pouco do nosso dia a dia aqui na {company}. O que achou dos bastidores?",
    "Hoje vamos mostrar como a magica acontece na {company}. Detras das cameras do nosso {topic}!",
  ],
  depoimento: [
    '"A {company} superou minhas expectativas! O atendimento e a qualidade sao impecaveis." - Cliente satisfeito. Venha voce tambem!',
    '"Melhor experiencia que ja tive com {topic}. Recomendo de olhos fechados!" - O que nossos clientes estao dizendo.',
    "O feedback que a gente recebe faz todo o esforço valer a pena. Obrigado por confiar na {company}!",
  ],
  curiosidade: [
    "Curiosidade do dia: {topic}! Voce ja sabia disso? Conta pra gente nos comentarios!",
    "Ate onde voce sabia que {topic}? A {company} te traz essa e outras curiosidades toda semana!",
    "Voce sabia? {topic}! A gente adora compartilhar conhecimento. Me conta: qual curiosidade voce quer ver por aqui?",
  ],
};

function generateFallbackPost(
  type: string,
  profile: any,
  topic?: string
): { title: string; content: string; hashtags: string[] } {
  const templates = fallbackTemplates[type] || fallbackTemplates.educacao;
  const template = templates[Math.floor(Math.random() * templates.length)];

  const company = profile?.companyName || "sua empresa";
  const segment = profile?.segment || "negocio";
  const offer = "20% de desconto";
  const deadline = "este fim de semana";
  const topicText = topic || segment;

  const content = template
    .replace(/{company}/g, company)
    .replace(/{topic}/g, topicText)
    .replace(/{offer}/g, offer)
    .replace(/{deadline}/g, deadline);

  const titles: Record<string, string[]> = {
    educacao: [
      "Dica especial de {topic}",
      "Voce ja conhece esse segredo?",
      "Aprenda mais sobre {topic}",
    ],
    promocao: [
      "Promocao especial na {company}!",
      "Nao perca essa oportunidade",
      "Oferta exclusiva por tempo limitado",
    ],
    bastidores: [
      "Bastidores da {company}",
      "Como a magica acontece",
      "Um dia na {company}",
    ],
    depoimento: [
      "O que dizem sobre a {company}",
      "Depoimento de cliente satisfeito",
      "A experiencia dos nossos clientes",
    ],
    curiosidade: [
      "Voce sabia? {topic}",
      "Curiosidade do dia",
      "Algo que poucos sabem sobre {topic}",
    ],
  };

  const titleTemplate =
    (titles[type] || titles.educacao)[
      Math.floor(Math.random() * (titles[type] || titles.educacao).length)
    ];

  const title = titleTemplate
    .replace(/{company}/g, company)
    .replace(/{topic}/g, topicText);

  const hashtags = [
    `#${company.replace(/\s/g, "")}`,
    `#${segment.charAt(0).toUpperCase() + segment.slice(1)}`,
    `#DicaDoDia`,
  ];

  return { title, content, hashtags };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { type, topic, date, time } = body;

    const profile = await prisma.companyProfile.findUnique({
      where: { userId: user.id },
    });

    // Se nao houver chave do Google AI, usa fallback
    if (!genAI) {
      const post = generateFallbackPost(type, profile, topic);
      return NextResponse.json({
        title: post.title,
        content: post.content,
        hashtags: post.hashtags,
        type,
        date: date || new Date().toISOString().split("T")[0],
        time: time || "12:00",
        warning:
          "Modo fallback: Configure GOOGLE_AI_API_KEY no .env para usar a IA real.",
      });
    }

    const prompt = `Voce e um especialista em marketing digital para redes sociais.

Dados da empresa:
- Nome: ${profile?.companyName || "Empresa"}
- Segmento: ${profile?.segment || "geral"}
- Tom de voz: ${profile?.voice || "descontraido"}
- Descricao: ${profile?.description || ""}
- Publico-alvo: ${profile?.targetAge || "geral"}, ${profile?.targetGender || "ambos"}
- Palavras preferidas: ${profile?.words || ""}
- Palavras para evitar: ${profile?.avoidWords || ""}
- Objetivo: ${profile?.objectives || "engajamento"}

${postTypePrompts[type] || postTypePrompts.educacao}
${topic ? `Tema especifico: ${topic}` : ""}

Gere um post com:
1. Titulo curto e chamativo (max 60 caracteres)
2. Conteudo do post (150-300 caracteres, pronto para Instagram/Facebook)
3. 3-5 hashtags relevantes

Responda APENAS em JSON no formato:
{"title": "...", "content": "...", "hashtags": ["#tag1", "#tag2", "#tag3"]}

Use portugues do Brasil. Evite palavras robotizadas. Seja natural e engajador.`;

    let responseText: string;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
    } catch (geminiError: any) {
      console.error("Google AI API error:", geminiError.message);

      if (geminiError.message?.includes("API key not valid") || geminiError.status === 400) {
        return NextResponse.json({
          title: generateFallbackPost(type, profile, topic).title,
          content: generateFallbackPost(type, profile, topic).content,
          hashtags: generateFallbackPost(type, profile, topic).hashtags,
          type,
          date: date || new Date().toISOString().split("T")[0],
          time: time || "12:00",
          warning:
            "Chave do Google AI invalida. Verifique sua GOOGLE_AI_API_KEY no dashboard da Vercel. Usando template de fallback.",
        });
      }

      // Para outros erros do Google AI, tambem usa fallback
      return NextResponse.json({
        title: generateFallbackPost(type, profile, topic).title,
        content: generateFallbackPost(type, profile, topic).content,
        hashtags: generateFallbackPost(type, profile, topic).hashtags,
        type,
        date: date || new Date().toISOString().split("T")[0],
        time: time || "12:00",
        warning: `Erro na API do Google AI. Usando template de fallback.`,
      });
    }

    let generated;

    try {
      // Tenta extrair JSON da resposta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generated = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      // Fallback se a IA nao retornar JSON valido
      const post = generateFallbackPost(type, profile, topic);
      generated = post;
    }

    return NextResponse.json({
      title: generated.title,
      content: generated.content,
      hashtags: generated.hashtags,
      type,
      date: date || new Date().toISOString().split("T")[0],
      time: time || "12:00",
    });
  } catch (error: any) {
    console.error("AI Generation error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar post" },
      { status: 500 }
    );
  }
}
