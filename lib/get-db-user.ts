import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getDbUser() {
  const session = await auth();
  if (!session?.user) return null;

  const stravaId = (session.user as { stravaId?: string }).stravaId;
  if (!stravaId) return null;

  return db.user.findUnique({ where: { stravaId } });
}
