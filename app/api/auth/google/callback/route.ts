import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { exchangeCodeForTokens, isGoogleOAuthConfigured, verifyGoogleIdToken } from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const baseRedirect = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(`${baseRedirect}/login?error=google_nao_configurado`);
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${baseRedirect}/login?error=google_cancelado`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseRedirect}/login?error=google_parametros_incompletos`);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${baseRedirect}/login?error=google_estado_invalido`);
  }
  cookieStore.delete("google_oauth_state");

  try {
    console.log("[Google OAuth] Exchanging code for tokens...");
    const tokens = await exchangeCodeForTokens(code);
    console.log("[Google OAuth] Tokens received, verifying ID token...");

    const profile = await verifyGoogleIdToken(tokens.id_token);
    console.log("[Google OAuth] Profile verified:", profile.email);

    if (!profile.email_verified) {
      return NextResponse.redirect(`${baseRedirect}/login?error=google_email_nao_verificado`);
    }

    if (!profile.sub || !profile.email) {
      return NextResponse.redirect(`${baseRedirect}/login?error=google_perfil_invalido`);
    }

    console.log("[Google OAuth] Looking up user by googleId...");
    let user = await prisma.user.findUnique({
      where: { googleId: profile.sub },
    });

    if (!user) {
      console.log("[Google OAuth] User not found by googleId, looking up by email...");
      user = await prisma.user.findUnique({
        where: { email: profile.email },
      });
      if (user) {
        console.log("[Google OAuth] Linking googleId to existing user...");
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: profile.sub,
            image: profile.picture || user.image,
          },
        });
      }
    }

    if (!user) {
      console.log("[Google OAuth] Creating new user...");
      try {
        const result = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: profile.email,
              name: profile.name || null,
              image: profile.picture || null,
              googleId: profile.sub,
              password: null,
            },
          });

          await tx.companyProfile.create({
            data: {
              userId: newUser.id,
              companyName: profile.name || "Minha Empresa",
              segment: "",
              plan: "starter",
            },
          });

          await tx.notificationSettings.create({
            data: {
              userId: newUser.id,
            },
          });

          return newUser;
        });

        user = result;
        console.log("[Google OAuth] New user created:", user.id);
      } catch (dbErr) {
        console.error("[Google OAuth] DB error during user creation:", dbErr);
        // Race condition: another request created the user
        if (dbErr instanceof Prisma.PrismaClientKnownRequestError && dbErr.code === "P2002") {
          user = await prisma.user.findUnique({ where: { googleId: profile.sub } });
          if (!user) {
            user = await prisma.user.findUnique({ where: { email: profile.email } });
          }
        }
        if (!user) throw dbErr;
      }
    }

    console.log("[Google OAuth] Creating session for user:", user.id);
    await createSession(user.id);
    console.log("[Google OAuth] Session created, redirecting to dashboard");
    return NextResponse.redirect(`${baseRedirect}/dashboard`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "No stack";
    console.error("[Google OAuth] CALLBACK ERROR:");
    console.error("Message:", message);
    console.error("Stack:", stack);
    return NextResponse.redirect(`${baseRedirect}/login?error=google_troca_code_falhou&details=${encodeURIComponent(message)}`);
  }
}
