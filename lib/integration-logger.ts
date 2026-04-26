import { prisma } from "./prisma";

export async function logIntegrationEvent({
  userId,
  event,
  platform,
  status,
  message,
  metadata,
}: {
  userId: string;
  event: string;
  platform?: string;
  status: "success" | "error" | "warning" | "info";
  message: string;
  metadata?: any;
}) {
  await prisma.integrationLog.create({
    data: {
      userId,
      event,
      platform: platform || null,
      status,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
