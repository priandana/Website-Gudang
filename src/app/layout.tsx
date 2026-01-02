import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notes App - Organize Your Thoughts",
  description: "A simple and elegant note-taking application that stores your notes in Google Sheets",
  keywords: ["notes", "note-taking", "organization", "productivity"],
  authors: [{ name: "Notes App Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
