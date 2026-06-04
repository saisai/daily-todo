import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Todo",
  description: "Daily task manager powered by Go + Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
