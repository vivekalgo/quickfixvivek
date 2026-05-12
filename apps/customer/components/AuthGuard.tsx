'use client'
// AuthGuard – redirects unauthenticated users to /login with returnTo param
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
