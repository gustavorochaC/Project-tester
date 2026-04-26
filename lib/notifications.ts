import { prisma } from "./prisma";

export async function shouldNotify(
  userId: string,
  eventType: string,
  channel: "whatsapp" | "email"
): Promise<boolean> {
  const rule = await prisma.notificationRule.findUnique({
    where: { userId_eventType: { userId, eventType } },
  });
  if (!rule || !rule.active) return false;
  const channels = JSON.parse(rule.channels);
  return channels[channel] === true;
}

export async function getNotificationTarget(
  userId: string,
  channel: "whatsapp" | "email"
): Promise<string | null> {
  const profile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (channel === "whatsapp") return profile?.whatsapp || null;
  if (channel === "email") return profile?.notificationEmail || null;
  return null;
}

export async function sendEventNotification({
  userId,
  eventType,
  message,
}: {
  userId: string;
  eventType: string;
  message: string;
}) {
  try {
    const shouldWhatsApp = await shouldNotify(userId, eventType, "whatsapp");
    const shouldEmail = await shouldNotify(userId, eventType, "email");

    if (shouldWhatsApp) {
      const phone = await getNotificationTarget(userId, "whatsapp");
      if (phone) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/whatsapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, message }),
        });
      }
    }

    if (shouldEmail) {
      const email = await getNotificationTarget(userId, "email");
      if (email) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: email, subject: `Social Pilot - ${eventType}`, text: message }),
        });
      }
    }
  } catch (error) {
    console.error(`[Notification] Failed to send ${eventType}:`, error);
  }
}
