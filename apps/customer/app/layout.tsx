import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
    title: 'QuickFix - Local Repair Services',
    description: 'Find and book trusted repair services near you — mobile, laptop, electrician, plumber, AC repair and more.',
    keywords: 'repair services, local repair, mobile repair, plumber, electrician, QuickFix',
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <div className="app-container">
                    <ClientProviders>
                        {children}
                    </ClientProviders>
                </div>
            </body>
        </html>
    )
}
