import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const isDemo = searchParams.get("demo") === "true";

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    );
  }

  try {
    if (isDemo || !code) {
      // Demo mode - simulate connection
      await prisma.socialAccount.upsert({
        where: {
          userId_platform: {
            userId: user.id,
            platform,
          },
        },
        update: {
          connected: true,
          accountName: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Demo`,
          accessToken: "demo-token",
        },
        create: {
          userId: user.id,
          platform,
          accountName: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Demo`,
          accessToken: "demo-token",
          connected: true,
        },
      });

      return NextResponse.redirect(
        new URL("/settings?socialConnected=true", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
      );
    }

    // Real OAuth flow would exchange code for token here
    // For now, fallback to demo
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform,
        },
      },
      update: {
        connected: true,
        accountName: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Conectado`,
        accessToken: "connected-token",
      },
      create: {
        userId: user.id,
        platform,
        accountName: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Conectado`,
        accessToken: "connected-token",
        connected: true,
      },
    });

    return NextResponse.redirect(
      new URL("/settings?socialConnected=true", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL("/settings?socialError=true", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    );
  }
}
