import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [posts, clients, trends] = await Promise.all([
    prisma.post.findMany({ where: { userId: user.id } }),
    prisma.client.findMany({ where: { userId: user.id } }),
    prisma.trend.findMany({ where: { userId: user.id } }),
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

  return {
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
  };
}
