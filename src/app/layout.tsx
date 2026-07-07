import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TankSight — Inspection Reporting & Client Portal",
  description:
    "Prototype client portal for API 653 tank floor inspection reporting: PAUT heatmaps, region breakdowns, trends, and downloadable PDF reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
