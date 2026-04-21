import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getDbUser() {
  const session = await auth();
  if (!session?.user) return null;

  const stravaId = (session.user as { stravaId?: string }).stravaId;
  if (!stravaId) return null;

  const existing = await db.user.findUnique({ where: { stravaId } });
  if (existing) return existing;

  // Auto-create user on first dashboard visit (before DbSync runs)
  return db.user.upsert({
    where: { stravaId },
    update: { name: session.user.name, image: session.user.image },
    create: {
      stravaId,
      name: session.user.name,
      email: session.user.email ?? `strava_${stravaId}@strava.local`,
      image: session.user.image,
    },
  });
}
