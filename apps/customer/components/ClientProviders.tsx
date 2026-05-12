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
        let isMounted = true
        const startListener = async () => {
            const listener = await App.addListener('backButton', (data) => {
                if (!isMounted) return
                
                // Only exit if exactly on home or login
                const currentPath = window.location.pathname
                if (currentPath === '/' || currentPath === '/login') {
                    App.exitApp()
                } else {
                    router.back()
                }
            })
            return listener
        }

        const listenerPromise = startListener()

        return () => {
            isMounted = false
            listenerPromise.then(l => l.remove())
        }
    }, [router]) // Remove pathname dependency to avoid re-adding listener on every navigation

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

import { NotificationService } from '@/services/notifications'
import { useAuth } from '@/lib/AuthContext'

// ... (existing BackButtonHandler and LocationGate)

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (user) {
            // Initialize the professional notification system
            NotificationService.initialize(user.uid, 'customer', router)
        }
    }, [user, router])

    return (
        <AuthProvider>
            <PermissionGuard>
                <BackButtonHandler />
                <LocationGate>
                    {children}
                </LocationGate>
            </PermissionGuard>
        </AuthProvider>
    )
}
