
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlanYar | Engineering Project Planner",
  description:
    "Professional engineering planning for CCTV, security, solar, UPS and smart home projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
