import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CrossBeam — AI ADU Permit Assistant',
  description: 'AI-powered permit review and corrections response for California ADUs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
