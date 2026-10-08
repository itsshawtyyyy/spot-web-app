import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPOT | Event momentum",
  description: "Turn event ideas into a coordinated plan with publishing, collaboration, and launch clarity.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
