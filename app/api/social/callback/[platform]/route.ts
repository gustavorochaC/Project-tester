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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!user) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  try {
    if (isDemo || !code) {
      await prisma.socialAccount.create({
        data: {
          userId: user.id,
          platform,
          accountName: `${platform} Demo`,
          accessToken: "demo-token",
          connected: true,
        },
      });
      return NextResponse.redirect(new URL("/integrations?connected=true", baseUrl));
    }

    if (platform === "facebook" || platform === "instagram") {
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;
      const redirectUri = `${baseUrl}/api/social/callback/${platform}`;

      const tokenRes = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`
      );
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      if (platform === "instagram") {
        return NextResponse.redirect(
          new URL(`/integrations/connect/select-page?platform=instagram&token=${accessToken}`, baseUrl)
        );
      }

      return NextResponse.redirect(
        new URL(`/integrations/connect/select-page?platform=facebook&token=${accessToken}`, baseUrl)
      );
    }

    if (platform === "linkedin") {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      const redirectUri = `${baseUrl}/api/social/callback/linkedin`;

      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId!,
          client_secret: clientSecret!,
        }),
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in || 3600;
      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      const refreshToken = tokenData.refresh_token || null;

      const profileRes = await fetch("https://api.linkedin.com/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profileData = await profileRes.json();
      const accountId = profileData.id;

      return NextResponse.redirect(
        new URL(`/integrations/connect/select-organization?token=${accessToken}&personId=${accountId}&expiresAt=${expiresAt.toISOString()}&refreshToken=${refreshToken || ""}`, baseUrl)
      );
    }

    return NextResponse.redirect(new URL("/integrations?error=unknown_platform", baseUrl));
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/integrations?error=true", baseUrl));
  }
}
