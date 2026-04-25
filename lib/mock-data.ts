export interface Post {
  id: string;
  title: string;
  content: string;
  hashtags: string[];
  type: "educacao" | "promocao" | "bastidores" | "depoimento" | "curiosidade";
  status: "pendente" | "aprovado" | "reprovado" | "publicado";
  date: string;
  time: string;
  image?: string;
  engagement?: number;
}

export interface Trend {
  id: string;
  title: string;
  description: string;
  urgency: "alta" | "media" | "baixa";
  suggestedPost: string;
  hashtags: string[];
  expiresIn: string;
  niche: string;
}

export interface Client {
  id: string;
  name: string;
  segment: string;
  postsThisMonth: number;
  pendingPosts: number;
  plan: "starter" | "pro" | "agency";
}

export const mockPosts: Post[] = [
  {
    id: "1",
    title: "5 dicas para um hamburger perfeito em casa",
    content: "Quem disse que precisa sair de casa para comer um hamburger digno de restaurante? Separamos 5 segredos que usamos aqui no Burger House todos os dias...",
    hashtags: ["#BurgerHouse", "#HamburgerArtesanal", "#DicasDeCozinha"],
    type: "educacao",
    status: "aprovado",
    date: "2025-04-25",
    time: "19:00",
    engagement: 245,
  },
  {
    id: "2",
    title: "Promocao de terca: 2x1 em todos os burgers",
    content: "Terca-feira e dia de dobrar a felicidade! Venha de 18h as 22h e aproveite nossa promocao 2x1 em todos os hamburgers do cardapio...",
    hashtags: ["#Promocao", "#2x1", "#BurgerHouse"],
    type: "promocao",
    status: "pendente",
    date: "2025-04-26",
    time: "12:00",
  },
  {
    id: "3",
    title: "Conheca nossa cozinha por dentro",
    content: "Hoje vamos mostrar um pouco dos bastidores do Burger House. Cada hamburger passa por um processo de preparo que leva em media 15 minutos...",
    hashtags: ["#Bastidores", "#BurgerHouse", "#CozinhaArtesanal"],
    type: "bastidores",
    status: "pendente",
    date: "2025-04-27",
    time: "15:00",
  },
  {
    id: "4",
    title: "O que nossos clientes estao dizendo",
    content: "\"Melhor hamburger que ja comi em Sao Paulo! A carne e suculenta, o pao e macio e os acompanhamentos sao incriveis.\" - Maria S.",
    hashtags: ["#Depoimento", "#ClienteSatisfeito", "#BurgerHouse"],
    type: "depoimento",
    status: "publicado",
    date: "2025-04-24",
    time: "18:30",
    engagement: 512,
  },
  {
    id: "5",
    title: "Voce sabia? A origem do hamburger",
    content: "O hamburger moderno surgiu no seculo XIX, mas a ideia de carne moida entre paes existe desde a epoca dos mongois...",
    hashtags: ["#Curiosidade", "#Historia", "#BurgerHouse"],
    type: "curiosidade",
    status: "pendente",
    date: "2025-04-28",
    time: "14:00",
  },
  {
    id: "6",
    title: "Novo burger do mes: Truffle Supreme",
    content: "Lancamento exclusivo de abril! O Truffle Supreme vem com blend de carnes nobres, queijo brie, cebola caramelizada e um toque de trufa negra...",
    hashtags: ["#Lancamento", "#TruffleSupreme", "#BurgerHouse"],
    type: "promocao",
    status: "aprovado",
    date: "2025-04-29",
    time: "19:30",
  },
  {
    id: "7",
    title: "Como escolher a carne ideal para seu burger",
    content: "O segredo de um bom hamburger comeca na escolha da carne. A proporcao ideal e 80% carne magra e 20% gordura...",
    hashtags: ["#Dicas", "#CarneIdeal", "#BurgerHouse"],
    type: "educacao",
    status: "pendente",
    date: "2025-04-30",
    time: "11:00",
  },
];

export const mockTrends: Trend[] = [
  {
    id: "1",
    title: "Dia Mundial do Hamburger",
    description: "O Dia Mundial do Hamburger esta bombando nas redes! Milhares de posts com a hashtag #DiaDoHamburger",
    urgency: "alta",
    suggestedPost: "Hoje e o Dia Mundial do Hamburger e aqui no Burger House a festa e garantida! Venha celebrar com a gente e ganhe 10% de desconto no seu pedido.",
    hashtags: ["#DiaDoHamburger", "#BurgerHouse", "#PromocaoDoDia"],
    expiresIn: "24 horas",
    niche: "Alimentacao",
  },
  {
    id: "2",
    title: "Tendencia: Burgers com queijo derretido",
    description: "Videos de queijo derretido em hamburgers estao viralizando no TikTok e Instagram Reels",
    urgency: "media",
    suggestedPost: "Aquele cheese pull que voce respeita! Nosso Cheese Explosion tem 3 tipos de queijo derretidos na medida certa.",
    hashtags: ["#CheesePull", "#BurgerHouse", "#QueijoDerretido"],
    expiresIn: "3 dias",
    niche: "Alimentacao",
  },
  {
    id: "3",
    title: "Semana do meio ambiente",
    description: "Proxima semana e a Semana do Meio Ambiente. Oportunidade para falar sobre embalagens sustentaveis",
    urgency: "baixa",
    suggestedPost: "Na Burger House, nos preocupamos com o planeta. Nossas embalagens sao 100% biodegradaveis e reciclaveis.",
    hashtags: ["#MeioAmbiente", "#Sustentabilidade", "#BurgerHouse"],
    expiresIn: "7 dias",
    niche: "Sustentabilidade",
  },
];

export const mockClients: Client[] = [
  {
    id: "1",
    name: "Burger House",
    segment: "Alimentacao",
    postsThisMonth: 20,
    pendingPosts: 3,
    plan: "pro",
  },
  {
    id: "2",
    name: "Dra. Ana Silva - Odontologia",
    segment: "Saude",
    postsThisMonth: 15,
    pendingPosts: 5,
    plan: "starter",
  },
  {
    id: "3",
    name: "Fit Academia",
    segment: "Fitness",
    postsThisMonth: 25,
    pendingPosts: 2,
    plan: "pro",
  },
];

export const postTypeColors = {
  educacao: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  promocao: "bg-green-500/20 text-green-400 border-green-500/30",
  bastidores: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  depoimento: "bg-red-500/20 text-red-400 border-red-500/30",
  curiosidade: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export const postTypeLabels = {
  educacao: "Educacao",
  promocao: "Promocao",
  bastidores: "Bastidores",
  depoimento: "Depoimento",
  curiosidade: "Curiosidade",
};

export const urgencyColors = {
  alta: "bg-red-500/20 text-red-400 border-red-500/30",
  media: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  baixa: "bg-green-500/20 text-green-400 border-green-500/30",
};

export const urgencyLabels = {
  alta: "Alta Urgencia",
  media: "Media Urgencia",
  baixa: "Baixa Urgencia",
};

export const statusColors = {
  pendente: "bg-yellow-500/20 text-yellow-400",
  aprovado: "bg-green-500/20 text-green-400",
  reprovado: "bg-red-500/20 text-red-400",
  publicado: "bg-blue-500/20 text-blue-400",
};

export const statusLabels = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  publicado: "Publicado",
};

export const planLabels = {
  starter: "Starter",
  pro: "Pro",
  agency: "Agencia",
};

export const planPrices = {
  starter: "R$ 197/mes",
  pro: "R$ 397/mes",
  agency: "R$ 997/mes",
};
