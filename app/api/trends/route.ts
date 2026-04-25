import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/trends - list all trends
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const trends = await prisma.trend.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(trends);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}

// POST /api/trends - create a new trend
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const trend = await prisma.trend.create({
      data: {
        title: body.title,
        description: body.description,
        urgency: body.urgency,
        suggestedPost: body.suggestedPost,
        hashtags: body.hashtags,
        expiresIn: body.expiresIn,
        niche: body.niche,
        userId: user.id,
      },
    });
    return NextResponse.json(trend, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create trend" }, { status: 500 });
  }
}
