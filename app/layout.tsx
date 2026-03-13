import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dead Reckoning",
  description: "Navigate history with only the information available at the time.",
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
