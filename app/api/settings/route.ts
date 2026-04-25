import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/settings - get company profile and notifications
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [profile, notifications] = await Promise.all([
      prisma.companyProfile.findUnique({ where: { userId: user.id } }),
      prisma.notificationSettings.findUnique({ where: { userId: user.id } }),
    ]);
    return NextResponse.json({ profile, notifications });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT /api/settings - update company profile and notifications
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { profile, notifications } = body;

    const updatedProfile = profile
      ? await prisma.companyProfile.upsert({
          where: { userId: user.id },
          update: profile,
          create: { ...profile, userId: user.id },
        })
      : null;

    const updatedNotifications = notifications
      ? await prisma.notificationSettings.upsert({
          where: { userId: user.id },
          update: notifications,
          create: { ...notifications, userId: user.id },
        })
      : null;

    return NextResponse.json({ profile: updatedProfile, notifications: updatedNotifications });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
