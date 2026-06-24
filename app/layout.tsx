import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Nav } from "@/components/nav"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Personal productivity dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-neutral-50`}>
        <Nav />
        <main className="ml-56 min-h-screen p-8">
          {children}
        </main>
      </body>
    </html>
  )
}
