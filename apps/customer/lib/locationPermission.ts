/**
 * locationPermission.ts
 * Clean geolocation utilities for both native Android (Capacitor) and web browser.
 * NO window.confirm/alert dialogs — all UX is handled by the location-setup page.
 */

import { Capacitor } from '@capacitor/core'

// ── Types ──────────────────────────────────────────────────────────────────────

export type LocationResult =
    | { ok: true; coords: [number, number] }
    | { ok: false; reason: 'denied' | 'unavailable' | 'timeout' | 'unknown' }

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unavailable'

// ── Helpers ────────────────────────────────────────────────────────────────────

export function isNativeAndroid(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export function isNativePlatform(): boolean {
    return Capacitor.isNativePlatform()
}

// ── Permission Check ───────────────────────────────────────────────────────────

/**
 * Check current location permission status without triggering a request.
 */
export async function checkLocationPermission(): Promise<PermissionStatus> {
    if (isNativePlatform()) {
        try {
            const { Geolocation } = await import('@capacitor/geolocation')
            const status = await Geolocation.checkPermissions()
            if (status.location === 'granted' || status.coarseLocation === 'granted') return 'granted'
            if (status.location === 'denied' || status.coarseLocation === 'denied') return 'denied'
            return 'prompt'
        } catch {
            return 'unavailable'
        }
    }

    // Web browser
    if (typeof navigator === 'undefined' || !navigator.permissions) return 'prompt'
    try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        if (result.state === 'granted') return 'granted'
        if (result.state === 'denied') return 'denied'
        return 'prompt'
    } catch {
        return 'prompt'
    }
}

// ── Request Permission (native only) ──────────────────────────────────────────

/**
 * Request location permission on native Android. Returns the new status.
 * On web, permission is requested implicitly when calling getCurrentPosition.
 */
export async function requestLocationPermission(): Promise<PermissionStatus> {
    if (!isNativePlatform()) return 'prompt'
    try {
        const { Geolocation } = await import('@capacitor/geolocation')
        const result = await Geolocation.requestPermissions()
        if (result.location === 'granted' || result.coarseLocation === 'granted') return 'granted'
        return 'denied'
    } catch {
        return 'unavailable'
    }
}

// ── Open App Settings (Android) ────────────────────────────────────────────────

/**
 * Opens Android app settings so the user can manually enable location permission.
 */
export async function openAppSettings(): Promise<void> {
    if (!isNativePlatform()) return
    try {
        // Capacitor v6+ App plugin supports openSettings via NativeSettings or fallback
        const { App } = await import('@capacitor/app')
        const appApi = App as unknown as { openSettings?: () => Promise<void> }
        if (typeof appApi.openSettings === 'function') {
            await appApi.openSettings()
        }
    } catch {
        // Silent — user can navigate manually
    }
}

// ── Get Current Position ───────────────────────────────────────────────────────

/**
 * Get the device's current GPS position.
 * Works on both native Android and web browser.
 * Returns a clean LocationResult — no exceptions thrown.
 */
export async function getCurrentPosition(): Promise<LocationResult> {
    if (isNativePlatform()) {
        try {
            const { Geolocation } = await import('@capacitor/geolocation')
            const pos = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 15000,
            })
            return { ok: true, coords: [pos.coords.latitude, pos.coords.longitude] }
        } catch (err: any) {
            const msg = err?.message?.toLowerCase() ?? ''
            if (msg.includes('denied') || msg.includes('permission')) return { ok: false, reason: 'denied' }
            if (msg.includes('timeout')) return { ok: false, reason: 'timeout' }
            return { ok: false, reason: 'unknown' }
        }
    }

    // Web browser
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return { ok: false, reason: 'unavailable' }
    }

    return new Promise<LocationResult>(resolve => {
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ ok: true, coords: [pos.coords.latitude, pos.coords.longitude] }),
            err => {
                if (err.code === 1) resolve({ ok: false, reason: 'denied' })
                else if (err.code === 3) resolve({ ok: false, reason: 'timeout' })
                else resolve({ ok: false, reason: 'unknown' })
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
    })
}

// ── Reverse Geocode ────────────────────────────────────────────────────────────

/**
 * Convert lat/lon to a human-readable address using OpenStreetMap Nominatim.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`,
            { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        // Build a clean short address: neighbourhood + city
        const addr = data?.address ?? {}
        const parts = [
            addr.neighbourhood || addr.suburb || addr.residential || addr.village,
            addr.city || addr.town || addr.county || addr.state_district,
        ].filter(Boolean)
        return parts.length > 0 ? parts.join(', ') : data.display_name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    } catch {
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }
}

// ── Location Storage Helpers ───────────────────────────────────────────────────

const LOCATION_KEY = 'qf_location'
const POSITION_KEY = 'qf_position'
const LOCATION_TS_KEY = 'qf_location_ts'
const STALE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes

export function getSavedLocation(): { label: string; coords: [number, number] | null } | null {
    if (typeof window === 'undefined') return null
    const label = localStorage.getItem(LOCATION_KEY)
    if (!label) return null
    const coordsRaw = localStorage.getItem(POSITION_KEY)
    const coords: [number, number] | null = coordsRaw ? JSON.parse(coordsRaw) : null
    return { label, coords }
}

export function saveLocation(label: string, coords?: [number, number]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(LOCATION_KEY, label)
    localStorage.setItem(LOCATION_TS_KEY, Date.now().toString())
    if (coords) localStorage.setItem(POSITION_KEY, JSON.stringify(coords))
}

export function clearSavedLocation(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(LOCATION_KEY)
    localStorage.removeItem(POSITION_KEY)
    localStorage.removeItem(LOCATION_TS_KEY)
    // Remove old flag that was blocking re-requests
    localStorage.removeItem('qf_location_permission_requested')
}

export function isLocationStale(): boolean {
    if (typeof window === 'undefined') return false
    const ts = localStorage.getItem(LOCATION_TS_KEY)
    if (!ts) return true
    return Date.now() - parseInt(ts, 10) > STALE_THRESHOLD_MS
}

// ── Legacy compatibility exports (used in existing page.tsx) ───────────────────

/** @deprecated Use getCurrentPosition() + requestLocationPermission() instead */
export async function ensureLocationPermissionWithUX(): Promise<boolean> {
    if (!isNativePlatform()) return true
    const status = await checkLocationPermission()
    if (status === 'granted') return true
    const after = await requestLocationPermission()
    return after === 'granted'
}

/** @deprecated Use getCurrentPosition() instead */
export async function fetchCurrentDevicePosition(): Promise<[number, number] | null> {
    const result = await getCurrentPosition()
    return result.ok ? result.coords : null
}
