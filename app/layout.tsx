import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Nav } from "@/components/nav"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Family Command Center",
  description: "Your family operations dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Family HQ",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#C8553D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#FAF4EC]`}>
        <Nav />
        {/* Desktop: offset for sidebar. Mobile: padding bottom for tab bar */}
        <main className="md:ml-56 min-h-screen p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  )
}
