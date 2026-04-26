const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function requireGoogleConfig() {
  if (!GOOGLE_CLIENT_ID) throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
  if (!GOOGLE_CLIENT_SECRET) throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
}

export function isGoogleOAuthConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function getGoogleAuthUrl(state: string): string {
  requireGoogleConfig();
  const redirectUri = `${APP_URL}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function generateState(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr.buffer);
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  id_token: string;
}> {
  requireGoogleConfig();
  const redirectUri = `${APP_URL}/api/auth/google/callback`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`google_token_exchange_failed: ${text}`);
  }

  const data = await res.json();
  if (!data.access_token || !data.id_token) {
    throw new Error("google_token_exchange_invalid_response");
  }
  return data;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  // Validate signature and claims using Google's public keys via their tokeninfo endpoint
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!res.ok) {
    throw new Error("google_id_token_invalid");
  }
  const payload = await res.json();
  if (payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("google_id_token_audience_mismatch");
  }
  if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") {
    throw new Error("google_id_token_issuer_invalid");
  }
  if (typeof payload.exp !== "undefined" && parseInt(payload.exp, 10) <= Date.now() / 1000) {
    throw new Error("google_id_token_expired");
  }
  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified === "true" || payload.email_verified === true,
    name: payload.name,
    picture: payload.picture,
  };
}
