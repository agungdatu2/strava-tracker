"use client";
import { useEffect } from "react";

export function DbSync({ needsSync }: { needsSync: boolean }) {
  useEffect(() => {
    if (!needsSync) return;
    fetch("/api/user/sync", { method: "POST" }).catch(console.error);
  }, [needsSync]);

  return null;
}
