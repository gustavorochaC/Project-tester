import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const [posts, clients] = await Promise.all([
      prisma.post.findMany({ where: { userId: user.id } }),
      prisma.client.findMany({ where: { userId: user.id } }),
    ]);

    const totalPosts = posts.length;
    const totalEngagement = posts.reduce((acc, p) => acc + (p.engagement || 0), 0);
    const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0;
    const topPosts = posts
      .filter((p) => p.engagement && p.engagement > 0)
      .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
      .slice(0, 5);

    const reportData = {
      generatedAt: new Date().toISOString(),
      user: { name: user.name, email: user.email },
      summary: {
        totalPosts,
        approvedPosts: posts.filter((p) => p.status === "aprovado").length,
        pendingPosts: posts.filter((p) => p.status === "pendente").length,
        publishedPosts: posts.filter((p) => p.status === "publicado").length,
        avgEngagement,
        totalClients: clients.length,
      },
      posts: posts.map((p) => ({
        title: p.title,
        type: p.type,
        status: p.status,
        date: p.date,
        time: p.time,
        engagement: p.engagement,
        content: p.content,
      })),
      topPosts: topPosts.map((p) => ({
        title: p.title,
        engagement: p.engagement,
        type: p.type,
      })),
      clients: clients.map((c) => ({
        name: c.name,
        segment: c.segment,
        postsThisMonth: c.postsThisMonth,
        plan: c.plan,
      })),
    };

    return NextResponse.json(reportData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao exportar relatorio" },
      { status: 500 }
    );
  }
}
