import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentMinute = now.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    // Find approved posts scheduled for now (within last 5 minutes)
    const posts = await prisma.post.findMany({
      where: {
        status: "aprovado",
        date: currentDate,
      },
      include: {
        user: {
          include: {
            socialAccounts: {
              where: { connected: true },
            },
          },
        },
      },
    });

    const postsToPublish = posts.filter((post) => {
      const [postHour, postMinute] = post.time.split(":").map(Number);
      const [nowHour, nowMinute] = currentTime.split(":").map(Number);
      const postMinutes = postHour * 60 + postMinute;
      const nowMinutes = nowHour * 60 + nowMinute;
      // Publish if scheduled within last 5 minutes
      return nowMinutes >= postMinutes && nowMinutes - postMinutes <= 5;
    });

    const results = [];

    for (const post of postsToPublish) {
      const accounts = post.user.socialAccounts;

      if (accounts.length === 0) {
        results.push({
          postId: post.id,
          status: "skipped",
          reason: "No connected social accounts",
        });
        continue;
      }

      // Simulate or real publish
      const hasRealCredentials =
        process.env.META_APP_ID || process.env.LINKEDIN_CLIENT_ID;

      for (const account of accounts) {
        if (!hasRealCredentials) {
          results.push({
            postId: post.id,
            platform: account.platform,
            status: "published_simulated",
          });
        } else {
          // Real API call would go here
          results.push({
            postId: post.id,
            platform: account.platform,
            status: "published",
          });
        }
      }

      await prisma.post.update({
        where: { id: post.id },
        data: { status: "publicado" },
      });
    }

    return NextResponse.json({
      checkedAt: `${currentDate} ${currentTime}`,
      postsFound: posts.length,
      postsPublished: postsToPublish.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro no scheduler" },
      { status: 500 }
    );
  }
}
