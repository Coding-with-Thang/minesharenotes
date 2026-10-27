import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { FontSizeSync } from "@/components/font-size-sync";
import { fontSizeBootScript } from "@/lib/font-size";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mineshare",
  description: "Keep notes and track tasks with due-date reminders.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-paper text-ink min-h-full font-sans">
        <Script id="font-size-boot" strategy="beforeInteractive">
          {fontSizeBootScript}
        </Script>
        <FontSizeSync />
        {children}
      </body>
    </html>
  );
}
