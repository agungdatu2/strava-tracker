import type { Activity } from "@prisma/client";
import { formatDistance, formatDurationHuman, formatPace, formatDate } from "./format";

// ─── CSV Export ────────────────────────────────────────────────────────────

export function activitiesToCSV(activities: Activity[]): string {
  const headers = [
    "Date", "Name", "Type", "Distance (km)", "Duration",
    "Avg Pace", "Avg Speed (km/h)", "Elevation (m)",
    "Avg HR", "Calories", "Kudos",
  ];

  const rows = activities.map((a) => [
    formatDate(a.startDate),
    `"${a.name.replace(/"/g, '""')}"`,
    a.type,
    (a.distance / 1000).toFixed(2),
    formatDurationHuman(a.movingTime),
    formatPace(a.avgSpeed),
    ((a.avgSpeed * 3600) / 1000).toFixed(1),
    Math.round(a.totalElevation),
    a.avgHeartRate ? Math.round(a.avgHeartRate) : "",
    a.calories ? Math.round(a.calories) : "",
    a.kudosCount,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// ─── PDF Export (uses jsPDF loaded dynamically) ───────────────────────────

export async function generatePDFReport(
  activities: Activity[],
  userName: string,
  period: string
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(252, 76, 2); // Strava orange
  doc.text("Strava Activity Report", 14, 18);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${userName} · ${period}`, 14, 26);
  doc.text(`Generated: ${new Date().toLocaleDateString("id-ID")}`, 14, 32);

  // Summary stats
  const totalDist = activities.reduce((s, a) => s + a.distance, 0);
  const totalTime = activities.reduce((s, a) => s + a.movingTime, 0);
  const totalElev = activities.reduce((s, a) => s + a.totalElevation, 0);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Total Activities: ${activities.length}`, 14, 42);
  doc.text(`Total Distance: ${formatDistance(totalDist)}`, 70, 42);
  doc.text(`Total Time: ${formatDurationHuman(totalTime)}`, 140, 42);
  doc.text(`Total Elevation: ${Math.round(totalElev)} m`, 210, 42);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [["Date", "Name", "Type", "Distance", "Duration", "Pace", "Elevation", "HR"]],
    body: activities.map((a) => [
      formatDate(a.startDate),
      a.name.length > 30 ? a.name.slice(0, 30) + "…" : a.name,
      a.type,
      formatDistance(a.distance),
      formatDurationHuman(a.movingTime),
      formatPace(a.avgSpeed),
      `${Math.round(a.totalElevation)} m`,
      a.avgHeartRate ? `${Math.round(a.avgHeartRate)} bpm` : "-",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [252, 76, 2] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  return doc.output("blob");
}
