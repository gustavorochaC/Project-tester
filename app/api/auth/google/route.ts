import { NextResponse } from "next/server";
import { generateState, getGoogleAuthUrl, isGoogleOAuthConfigured } from "@/lib/google-oauth";

export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        error: "Google OAuth não configurado",
        message:
          "As variáveis GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não estão definidas no ambiente. Crie as credenciais em https://console.cloud.google.com/apis/credentials e adicione-as ao seu .env",
      },
      { status: 503 }
    );
  }

  const state = generateState();
  const url = getGoogleAuthUrl(state);

  const response = NextResponse.redirect(url);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5, // 5 minutes
    path: "/",
    sameSite: "lax",
  });

  return response;
}
