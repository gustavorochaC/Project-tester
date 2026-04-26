import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { publishToPlatform } from "@/lib/social-publish";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { postId } = body;

    const post = await prisma.post.findFirst({
      where: { id: postId, userId: user.id },
    });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    let accountIds: string[] = [];
    try {
      accountIds = post.socialAccountIds ? JSON.parse(post.socialAccountIds) : [];
    } catch {
      accountIds = [];
    }

    const accounts = accountIds.length > 0
      ? await prisma.socialAccount.findMany({
          where: { id: { in: accountIds }, userId: user.id, connected: true },
        })
      : await prisma.socialAccount.findMany({
          where: { userId: user.id, connected: true },
        });

    if (accounts.length === 0) {
      return NextResponse.json({ error: "Nenhuma conta conectada" }, { status: 400 });
    }

    const results = [];
    let anyFailed = false;

    for (const account of accounts) {
      const result = await publishToPlatform({ post, account });
      results.push({ platform: account.platform, accountId: account.id, ...result });
      if (!result.success) anyFailed = true;
    }

    const newStatus = anyFailed ? "falhou" : "publicado";
    await prisma.post.update({ where: { id: postId }, data: { status: newStatus } });

    return NextResponse.json({ success: !anyFailed, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
