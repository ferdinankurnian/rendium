import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rendium",
  description: "Clean and simple bookmark manager",
  openGraph: {
    title: "Rendium",
    description: "Clean and simple bookmark manager",
    url: "https://rendium.iydheko.site",
    siteName: "Rendium",
    images: [
      {
        url: "/og-rendium.png",
        width: 1200,
        height: 630,
        alt: "Rendium Open Graph Image",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rendium",
    description: "Clean and simple bookmark manager",
    images: ["/og-rendium.png"],
  },
  icons: {
    icon: '/rendium.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            <ThemeProvider defaultTheme="system" storageKey="rendium-ui-theme">
              {children}
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
