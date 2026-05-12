'use client'
// AuthGuard – redirects unauthenticated users to /login with returnTo param
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !user) {
            router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`)
        }
    }, [user, loading, router, pathname])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #0F3460 100%)' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/60 text-sm font-medium">Loading QuickFix…</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    return <>{children}</>
}
