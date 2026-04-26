import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /auth/me] Error:", message);
    return NextResponse.json({ error: "Erro interno", details: message }, { status: 500 });
  }
}
