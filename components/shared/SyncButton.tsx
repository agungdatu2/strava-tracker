"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      setMessage(data.message ?? "Sync dimulai");
    } catch {
      setMessage("Sync gagal");
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
      <button
        onClick={handleSync}
        disabled={syncing}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        )}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
        {syncing ? "Syncing..." : "Sync"}
      </button>
    </div>
  );
}
