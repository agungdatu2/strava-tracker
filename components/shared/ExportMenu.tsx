"use client";
import { useState } from "react";
import { Download, FileText, Sheet } from "lucide-react";

export function ExportMenu() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"csv" | "pdf" | null>(null);

  const handleExport = async (format: "csv" | "pdf") => {
    setLoading(format);
    setOpen(false);
    try {
      const res = await fetch(`/api/export?format=${format}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `strava-activities.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border hover:bg-accent transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        {loading ? "Exporting..." : "Export"}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 rounded-lg border bg-popover shadow-md z-10">
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-t-lg"
          >
            <Sheet className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-b-lg"
          >
            <FileText className="h-3.5 w-3.5" /> Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
