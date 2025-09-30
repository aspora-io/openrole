import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenRole.net - Transparent Job Platform',
  description: 'Fair hiring with mandatory salary transparency and verified employers',
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