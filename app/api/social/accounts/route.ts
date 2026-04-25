import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: user.id, connected: true },
  });

  return NextResponse.json(accounts);
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID obrigatorio" }, { status: 400 });
  }

  await prisma.socialAccount.updateMany({
    where: { id, userId: user.id },
    data: { connected: false },
  });

  return NextResponse.json({ success: true });
}
