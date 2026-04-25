import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  // Create default user with hashed password
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@socialpilot.com" },
    update: {},
    create: {
      email: "admin@socialpilot.com",
      name: "Admin",
      password: hashedPassword,
      role: "admin",
    },
  });

  // Create company profile
  await prisma.companyProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      companyName: "Burger House",
      segment: "alimentacao",
      description:
        "Hamburgueria artesanal com ingredientes frescos e selecionados. Especializada em burgers gourmet e experiencias unicas.",
      city: "Sao Paulo",
      targetAge: "26-35",
      targetGender: "ambos",
      voice: "descontraido",
      words: "artesanal, exclusivo, premium",
      avoidWords: "barato, simples, basico",
      objectives: "todos",
      frequency: "5",
      instagram: true,
      facebook: true,
      linkedin: false,
      whatsapp: "(11) 99999-9999",
      plan: "pro",
    },
  });

  // Create notification settings
  await prisma.notificationSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      whatsapp: true,
      email: true,
      trends: true,
      weekly: false,
    },
  });

  // Create posts
  const postsData = [
    {
      title: "5 dicas para um hamburger perfeito em casa",
      content:
        "Quem disse que precisa sair de casa para comer um hamburger digno de restaurante? Separamos 5 segredos que usamos aqui no Burger House todos os dias...",
      hashtags: JSON.stringify(["#BurgerHouse", "#HamburgerArtesanal", "#DicasDeCozinha"]),
      type: "educacao",
      status: "aprovado",
      date: "2025-04-25",
      time: "19:00",
      engagement: 245,
    },
    {
      title: "Promocao de terca: 2x1 em todos os burgers",
      content:
        "Terca-feira e dia de dobrar a felicidade! Venha de 18h as 22h e aproveite nossa promocao 2x1 em todos os hamburgers do cardapio...",
      hashtags: JSON.stringify(["#Promocao", "#2x1", "#BurgerHouse"]),
      type: "promocao",
      status: "pendente",
      date: "2025-04-26",
      time: "12:00",
    },
    {
      title: "Conheca nossa cozinha por dentro",
      content:
        "Hoje vamos mostrar um pouco dos bastidores do Burger House. Cada hamburger passa por um processo de preparo que leva em media 15 minutos...",
      hashtags: JSON.stringify(["#Bastidores", "#BurgerHouse", "#CozinhaArtesanal"]),
      type: "bastidores",
      status: "pendente",
      date: "2025-04-27",
      time: "15:00",
    },
    {
      title: "O que nossos clientes estao dizendo",
      content:
        '"Melhor hamburger que ja comi em Sao Paulo! A carne e suculenta, o pao e macio e os acompanhamentos sao incriveis." - Maria S.',
      hashtags: JSON.stringify(["#Depoimento", "#ClienteSatisfeito", "#BurgerHouse"]),
      type: "depoimento",
      status: "publicado",
      date: "2025-04-24",
      time: "18:30",
      engagement: 512,
    },
    {
      title: "Voce sabia? A origem do hamburger",
      content:
        "O hamburger moderno surgiu no seculo XIX, mas a ideia de carne moida entre paes existe desde a epoca dos mongois...",
      hashtags: JSON.stringify(["#Curiosidade", "#Historia", "#BurgerHouse"]),
      type: "curiosidade",
      status: "pendente",
      date: "2025-04-28",
      time: "14:00",
    },
    {
      title: "Novo burger do mes: Truffle Supreme",
      content:
        "Lancamento exclusivo de abril! O Truffle Supreme vem com blend de carnes nobres, queijo brie, cebola caramelizada e um toque de trufa negra...",
      hashtags: JSON.stringify(["#Lancamento", "#TruffleSupreme", "#BurgerHouse"]),
      type: "promocao",
      status: "aprovado",
      date: "2025-04-29",
      time: "19:30",
    },
    {
      title: "Como escolher a carne ideal para seu burger",
      content:
        "O segredo de um bom hamburger comeca na escolha da carne. A proporcao ideal e 80% carne magra e 20% gordura...",
      hashtags: JSON.stringify(["#Dicas", "#CarneIdeal", "#BurgerHouse"]),
      type: "educacao",
      status: "pendente",
      date: "2025-04-30",
      time: "11:00",
    },
  ];

  for (const post of postsData) {
    await prisma.post.upsert({
      where: { id: `${postsData.indexOf(post) + 1}` },
      update: {},
      create: {
        ...post,
        userId: user.id,
      },
    });
  }

  // Create clients
  const clientsData = [
    {
      name: "Burger House",
      segment: "Alimentacao",
      postsThisMonth: 20,
      pendingPosts: 3,
      plan: "pro",
    },
    {
      name: "Dra. Ana Silva - Odontologia",
      segment: "Saude",
      postsThisMonth: 15,
      pendingPosts: 5,
      plan: "starter",
    },
    {
      name: "Fit Academia",
      segment: "Fitness",
      postsThisMonth: 25,
      pendingPosts: 2,
      plan: "pro",
    },
  ];

  for (const client of clientsData) {
    await prisma.client.upsert({
      where: { id: `${clientsData.indexOf(client) + 1}` },
      update: {},
      create: {
        ...client,
        userId: user.id,
      },
    });
  }

  // Create trends
  const trendsData = [
    {
      title: "Dia Mundial do Hamburger",
      description:
        "O Dia Mundial do Hamburger esta bombando nas redes! Milhares de posts com a hashtag #DiaDoHamburger",
      urgency: "alta",
      suggestedPost:
        "Hoje e o Dia Mundial do Hamburger e aqui no Burger House a festa e garantida! Venha celebrar com a gente e ganhe 10% de desconto no seu pedido.",
      hashtags: JSON.stringify(["#DiaDoHamburger", "#BurgerHouse", "#PromocaoDoDia"]),
      expiresIn: "24 horas",
      niche: "Alimentacao",
    },
    {
      title: "Tendencia: Burgers com queijo derretido",
      description:
        "Videos de queijo derretido em hamburgers estao viralizando no TikTok e Instagram Reels",
      urgency: "media",
      suggestedPost:
        "Aquele cheese pull que voce respeita! Nosso Cheese Explosion tem 3 tipos de queijo derretidos na medida certa.",
      hashtags: JSON.stringify(["#CheesePull", "#BurgerHouse", "#QueijoDerretido"]),
      expiresIn: "3 dias",
      niche: "Alimentacao",
    },
    {
      title: "Semana do meio ambiente",
      description:
        "Proxima semana e a Semana do Meio Ambiente. Oportunidade para falar sobre embalagens sustentaveis",
      urgency: "baixa",
      suggestedPost:
        "Na Burger House, nos preocupamos com o planeta. Nossas embalagens sao 100% biodegradaveis e reciclaveis.",
      hashtags: JSON.stringify(["#MeioAmbiente", "#Sustentabilidade", "#BurgerHouse"]),
      expiresIn: "7 dias",
      niche: "Sustentabilidade",
    },
  ];

  for (const trend of trendsData) {
    await prisma.trend.upsert({
      where: { id: `${trendsData.indexOf(trend) + 1}` },
      update: {},
      create: {
        ...trend,
        userId: user.id,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
