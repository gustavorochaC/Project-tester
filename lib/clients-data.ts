import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

export async function getClientsData() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
  });

  return clients;
}
