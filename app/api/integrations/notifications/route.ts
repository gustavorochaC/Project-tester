import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = await prisma.notificationRule.findMany({ where: { userId: user.id } });
  const profile = await prisma.companyProfile.findUnique({ where: { userId: user.id } });

  return NextResponse.json({
    rules,
    whatsapp: profile?.whatsapp || "",
    notificationEmail: profile?.notificationEmail || "",
  });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { rules, whatsapp, notificationEmail } = body;

  await prisma.companyProfile.update({
    where: { userId: user.id },
    data: { whatsapp, notificationEmail },
  });

  for (const rule of rules) {
    await prisma.notificationRule.upsert({
      where: { userId_eventType: { userId: user.id, eventType: rule.eventType } },
      update: { channels: JSON.stringify(rule.channels), active: rule.active },
      create: {
        userId: user.id,
        eventType: rule.eventType,
        channels: JSON.stringify(rule.channels),
        active: rule.active,
      },
    });
  }

  return NextResponse.json({ success: true });
}
