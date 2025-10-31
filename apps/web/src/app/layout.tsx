import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '../components/layout/Header'
import { Providers } from '../context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenRole.net - Transparent Job Platform',
  description: 'The transparent job platform where every role shows salary ranges, companies are verified, and hiring is fair for everyone.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}