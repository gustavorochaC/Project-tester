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

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const account = await prisma.socialAccount.create({
      data: {
        userId: user.id,
        platform: body.platform,
        accountId: body.accountId || null,
        accountName: body.accountName || null,
        accessToken: body.accessToken || "",
        refreshToken: body.refreshToken || null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        connected: true,
      },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar conta" }, { status: 500 });
  }
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
