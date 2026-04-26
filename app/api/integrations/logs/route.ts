import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const status = searchParams.get("status");
  const event = searchParams.get("event");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");

  const where: any = { userId: user.id };
  if (platform) where.platform = platform;
  if (status) where.status = status;
  if (event) where.event = event;

  const [logs, total] = await Promise.all([
    prisma.integrationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.integrationLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}
