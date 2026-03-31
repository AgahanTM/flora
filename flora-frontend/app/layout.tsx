import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Flora - Romantic Flower Delivery",
    template: "Flora | %s",
  },
  description: "Send love, one bloom at a time. Soft romantic flower and gift e-commerce platform.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://flora.tm",
    siteName: "Flora",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Flora - Fresh Flowers & Gifts",
      },
    ],
  },
};

import { Navbar } from "@/components/layout/Navbar";
import { RouteProgressBar } from "@/components/layout/RouteProgressBar";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
