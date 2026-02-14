import type { Metadata } from "next"
import { Playfair_Display, Nunito } from "next/font/google"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["700", "900"],
  display: "swap",
})

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "CrossBeam | AI-Powered ADU Permit Review",
  description: "AI permit review assistant for California ADUs. Built with Claude Opus 4.6.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${nunito.variable}`}>
      <body className="antialiased bg-crossbeam-gradient">
        {children}
      </body>
    </html>
  )
}
