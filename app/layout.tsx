import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { ProgressBar } from "@/components/shared/ProgressBar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Strava Tracker", template: "%s | Strava Tracker" },
  description: "Track your Strava workouts with insights, goals, and badges.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ProgressBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
