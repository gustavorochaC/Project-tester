import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard - get dashboard metrics
export async function GET() {
  try {
    const [posts, clients, trends] = await Promise.all([
      prisma.post.findMany(),
      prisma.client.findMany(),
      prisma.trend.findMany(),
    ]);

    const totalPosts = posts.length;
    const pendingPosts = posts.filter((p) => p.status === "pendente").length;
    const approvedPosts = posts.filter((p) => p.status === "aprovado").length;
    const totalEngagement = posts.reduce((acc, p) => acc + (p.engagement || 0), 0);
    const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0;

    const totalClients = clients.length;
    const clientPostsThisMonth = clients.reduce((acc, c) => acc + c.postsThisMonth, 0);
    const clientPendingPosts = clients.reduce((acc, c) => acc + c.pendingPosts, 0);

    const trendCount = trends.length;

    return NextResponse.json({
      totalPosts,
      pendingPosts,
      approvedPosts,
      avgEngagement,
      totalClients,
      clientPostsThisMonth,
      clientPendingPosts,
      trendCount,
      recentPosts: posts.slice(0, 5),
      nextPost: posts.find((p) => p.status === "aprovado") || null,
      topPosts: posts
        .filter((p) => p.engagement && p.engagement > 0)
        .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
        .slice(0, 3),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
