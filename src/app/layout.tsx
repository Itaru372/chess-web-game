import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Web Game",
  description: "Play chess against AI with a clean and intuitive interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
