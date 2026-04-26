import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const oauthConfigs: Record<string, { authUrl: string; scopes: string; clientEnv: string }> = {
  instagram: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    scopes: "instagram_basic,instagram_content_publish,pages_read_engagement",
    clientEnv: "META_APP_ID",
  },
  facebook: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    scopes: "pages_manage_posts,pages_read_engagement,publish_video",
    clientEnv: "META_APP_ID",
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    scopes: "w_member_social,r_liteprofile,r_organization_social,w_organization_social",
    clientEnv: "LINKEDIN_CLIENT_ID",
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { platform } = await params;
  const config = oauthConfigs[platform];

  if (!config) {
    return NextResponse.json({ error: "Plataforma invalida" }, { status: 400 });
  }

  const clientId = process.env[config.clientEnv];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/social/callback/${platform}`;

  if (!clientId) {
    const demoUrl = new URL(`${baseUrl}/api/social/callback/${platform}`);
    demoUrl.searchParams.set("demo", "true");
    return NextResponse.redirect(demoUrl);
  }

  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", config.scopes);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", user.id);

  return NextResponse.redirect(url);
}
