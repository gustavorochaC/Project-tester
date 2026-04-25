import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/settings - get company profile and notifications
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "1";

  try {
    const [profile, notifications] = await Promise.all([
      prisma.companyProfile.findUnique({ where: { userId } }),
      prisma.notificationSettings.findUnique({ where: { userId } }),
    ]);
    return NextResponse.json({ profile, notifications });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT /api/settings - update company profile and notifications
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = "1", profile, notifications } = body;

    const updatedProfile = profile
      ? await prisma.companyProfile.upsert({
          where: { userId },
          update: profile,
          create: { ...profile, userId },
        })
      : null;

    const updatedNotifications = notifications
      ? await prisma.notificationSettings.upsert({
          where: { userId },
          update: notifications,
          create: { ...notifications, userId },
        })
      : null;

    return NextResponse.json({ profile: updatedProfile, notifications: updatedNotifications });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
