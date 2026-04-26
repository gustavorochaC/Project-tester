import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishToPlatform } from "@/lib/social-publish";

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentMinute = now.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    const posts = await prisma.post.findMany({
      where: { status: "aprovado", date: currentDate },
      include: {
        user: { include: { socialAccounts: { where: { connected: true } } } },
      },
    });

    const postsToPublish = posts.filter((post) => {
      const [postHour, postMinute] = post.time.split(":").map(Number);
      const [nowHour, nowMinute] = currentTime.split(":").map(Number);
      const postMinutes = postHour * 60 + postMinute;
      const nowMinutes = nowHour * 60 + nowMinute;
      return nowMinutes >= postMinutes && nowMinutes - postMinutes <= 5;
    });

    const results = [];

    for (const post of postsToPublish) {
      let accountIds: string[] = [];
      try {
        accountIds = post.socialAccountIds ? JSON.parse(post.socialAccountIds) : [];
      } catch {
        accountIds = [];
      }

      const accounts = accountIds.length > 0
        ? await prisma.socialAccount.findMany({
            where: { id: { in: accountIds }, userId: post.userId, connected: true },
          })
        : post.user.socialAccounts;

      if (accounts.length === 0) {
        results.push({ postId: post.id, status: "skipped", reason: "No accounts" });
        continue;
      }

      let anyFailed = false;
      for (const account of accounts) {
        const result = await publishToPlatform({ post, account });
        results.push({
          postId: post.id,
          platform: account.platform,
          status: result.success ? "published" : "failed",
          error: result.error,
        });
        if (!result.success) anyFailed = true;
      }

      await prisma.post.update({
        where: { id: post.id },
        data: { status: anyFailed ? "falhou" : "publicado" },
      });
    }

    return NextResponse.json({
      checkedAt: `${currentDate} ${currentTime}`,
      postsFound: posts.length,
      postsPublished: postsToPublish.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
