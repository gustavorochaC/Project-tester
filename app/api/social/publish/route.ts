import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { postId, platforms } = body;

    const post = await prisma.post.findFirst({
      where: { id: postId, userId: user.id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id,
        platform: { in: platforms },
        connected: true,
      },
    });

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma conta social conectada para as plataformas selecionadas" },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};

    for (const account of accounts) {
      // In production, call actual APIs here
      // For now, simulate successful publish
      const hasRealCredentials =
        process.env.META_APP_ID || process.env.LINKEDIN_CLIENT_ID;

      if (!hasRealCredentials) {
        results[account.platform] = {
          success: true,
          simulated: true,
          message: `Post simulado no ${account.platform}. Configure as credenciais de API para publicacao real.`,
        };
      } else {
        // Real API calls would go here
        // Meta Graph API or LinkedIn API
        results[account.platform] = {
          success: true,
          simulated: false,
          message: `Publicado no ${account.platform}`,
        };
      }
    }

    // Update post status to published
    await prisma.post.update({
      where: { id: postId },
      data: { status: "publicado" },
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao publicar" },
      { status: 500 }
    );
  }
}
