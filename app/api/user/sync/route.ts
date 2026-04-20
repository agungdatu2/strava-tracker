import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

// Dipanggil dari client setelah login untuk sync user + token ke DB
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = session.user as {
    stravaId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    scope?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };

  if (!token.stravaId) return NextResponse.json({ error: "No stravaId" }, { status: 400 });

  try {
    const user = await db.user.upsert({
      where: { stravaId: token.stravaId },
      update: { name: token.name, image: token.image },
      create: {
        stravaId: token.stravaId,
        name: token.name,
        email: token.email,
        image: token.image,
      },
    });

    if (token.accessToken && token.refreshToken && token.expiresAt) {
      await db.stravaToken.upsert({
        where: { userId: user.id },
        update: {
          accessToken: encrypt(token.accessToken),
          refreshToken: encrypt(token.refreshToken),
          expiresAt: new Date(token.expiresAt * 1000),
          scope: token.scope ?? "",
        },
        create: {
          userId: user.id,
          accessToken: encrypt(token.accessToken),
          refreshToken: encrypt(token.refreshToken),
          expiresAt: new Date(token.expiresAt * 1000),
          scope: token.scope ?? "",
        },
      });
    }

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error("[user/sync]", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
