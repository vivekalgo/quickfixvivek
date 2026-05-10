'use client'
/**
 * ClientProviders
 * Wraps the app in AuthProvider and LocationGate.
 *
 * LocationGate: On every mount, checks if a location is saved in localStorage.
 * If not, redirects to /location-setup. This runs on every app open.
 *
 * Exempt routes (no location check): /login, /location-setup
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { App } from '@capacitor/app'
import { AuthProvider } from '@/lib/AuthContext'
import { getSavedLocation } from '@/lib/locationPermission'
import PermissionGuard from '@/components/PermissionGuard'
import NotificationListener from '@/components/NotificationListener'
import PushNotificationManager from '@/components/PushNotificationManager'

// Routes that do NOT require a location to be set first
const LOCATION_EXEMPT = ['/login', '/location-setup']

/**
 * Handles Android Hardware Back Button
 */
function BackButtonHandler() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const backListener = App.addListener('backButton', (data) => {
            if (pathname === '/' || pathname === '/login') {
                // If on home or login, exit the app
                App.exitApp()
            } else {
                // Otherwise go back in history
                router.back()
            }
        })

        return () => {
            backListener.then(l => l.remove())
        }
    }, [pathname, router])

    return null
}

function LocationGate({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (LOCATION_EXEMPT.some(p => pathname.startsWith(p))) return

        const saved = getSavedLocation()
        const ts = typeof window !== 'undefined' ? localStorage.getItem('qf_location_ts') : null

        if (!saved || !ts) {
            // If it's legacy data without a timestamp, clear it out
            if (saved && !ts && typeof window !== 'undefined') {
                localStorage.removeItem('qf_location')
                localStorage.removeItem('qf_position')
            }
            // Preserve the page the user was trying to reach
            router.replace(`/location-setup?returnTo=${encodeURIComponent(pathname)}`)
        }
    }, [pathname, router])

    return <>{children}</>
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <PermissionGuard>
                <PushNotificationManager />
                <NotificationListener />
                <BackButtonHandler />
                <LocationGate>
                    {children}
                </LocationGate>
            </PermissionGuard>
        </AuthProvider>
    )
}
