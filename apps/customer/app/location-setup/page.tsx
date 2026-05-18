'use client'
/**
 * /location-setup
 * Shown every time the app opens and no location is saved.
 * Two actions: GPS auto-detect OR manual text entry.
 * Works on both Android native (Capacitor) and web browser.
 */
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
    checkLocationPermission,
    requestLocationPermission,
    getCurrentPosition,
    reverseGeocode,
    saveLocation,
    openAppSettings,
    isNativePlatform,
} from '@/lib/locationPermission'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/data'

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase =
    | 'idle'           // initial screen
    | 'requesting'     // asking for permission / fetching GPS
    | 'locating'       // GPS acquired, reverse geocoding
    | 'denied'         // permission permanently denied
    | 'error'          // other GPS error
    | 'manual'         // manual text input mode

// ── Inner component (uses useSearchParams) ────────────────────────────────────
function LocationSetupInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnTo = searchParams.get('returnTo') || '/'
    const { user } = useAuth()

    const [phase, setPhase] = useState<Phase>('idle')
    const [manualInput, setManualInput] = useState('')
    const [detectedLabel, setDetectedLabel] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // Animate pin drop on mount
    const [pinDropped, setPinDropped] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setPinDropped(true), 400)
        return () => clearTimeout(t)
    }, [])

    // Focus input when entering manual mode
    useEffect(() => {
        if (phase === 'manual') setTimeout(() => inputRef.current?.focus(), 100)
    }, [phase])

    // ── Core: auto-locate ─────────────────────────────────────────────────────
    const handleUseCurrentLocation = async () => {
        setPhase('requesting')
        setErrorMsg('')

        // On native Android, check + request permission first
        if (isNativePlatform()) {
            const perm = await checkLocationPermission()
            if (perm === 'denied') {
                if (confirm('Location permission is denied. Open your phone Settings to allow location access for QuickFix?')) {
                    await openAppSettings()
                }
                setPhase('denied')
                return
            }
            if (perm === 'prompt') {
                const after = await requestLocationPermission()
                if (after !== 'granted') {
                    if (confirm('Location permission was denied. Would you like to open your phone Settings to enable it?')) {
                        await openAppSettings()
                    }
                    setPhase('denied')
                    return
                }
            }
        }

        // Get GPS position
        const result = await getCurrentPosition()

        if (!result.ok) {
            if (result.reason === 'denied') {
                setPhase('denied')
            } else {
                setErrorMsg(
                    result.reason === 'timeout'
                        ? 'GPS signal not found. Try moving to an open area or enter manually.'
                        : 'Could not get your location. Please try again or enter manually.'
                )
                setPhase('error')
            }
            return
        }

        // Reverse geocode
        setPhase('locating')
        const label = await reverseGeocode(result.coords[0], result.coords[1])
        setDetectedLabel(label)
        saveLocation(label, result.coords)

        if (returnTo.includes('/profile/addresses') && user) {
            await supabase.from('user_addresses').insert({
                user_id: user.uid,
                type: 'Other',
                full_address: label,
                latitude: result.coords[0],
                longitude: result.coords[1],
                is_default: false
            })
        }

        // Small delay so user sees the detected location
        await new Promise(r => setTimeout(r, 700))
        router.replace(returnTo)
    }

    // Auto-prompt GPS on native Android immediately on launch
    const hasAutoPrompted = useRef(false)
    useEffect(() => {
        if (isNativePlatform() && phase === 'idle' && !hasAutoPrompted.current) {
            hasAutoPrompted.current = true
            // Small delay to let the initial animation play
            setTimeout(() => {
                handleUseCurrentLocation()
            }, 600)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Manual entry confirm ──────────────────────────────────────────────────
    const handleManualConfirm = async () => {
        const trimmed = manualInput.trim()
        if (trimmed.length < 3) return
        saveLocation(trimmed)
        
        if (returnTo.includes('/profile/addresses') && user) {
            await supabase.from('user_addresses').insert({
                user_id: user.uid,
                type: 'Other',
                full_address: trimmed,
                is_default: false
            })
        }
        
        router.replace(returnTo)
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">

            {/* ── Top area: animated map pin ── */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* Subtle radial background pulse */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    aria-hidden
                >
                    <div
                        className="w-72 h-72 rounded-full opacity-[0.06]"
                        style={{
                            background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)',
                            animation: 'pulse-ring 2.5s ease-in-out infinite',
                        }}
                    />
                </div>

                {/* Map pin SVG — drops in on mount */}
                <div
                    style={{
                        transform: pinDropped ? 'translateY(0)' : 'translateY(-60px)',
                        opacity: pinDropped ? 1 : 0,
                        transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
                    }}
                >
                    {phase === 'requesting' || phase === 'locating' ? (
                        /* Spinning location search indicator */
                        <div className="relative w-24 h-24">
                            <div
                                className="absolute inset-0 rounded-full border-4 border-t-[#FF6B35] border-r-[#FF6B35]/30 border-b-[#FF6B35]/10 border-l-[#FF6B35]/50"
                                style={{ animation: 'spin 1s linear infinite' }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                                        fill="#FF6B35" />
                                    <circle cx="12" cy="9" r="2.5" fill="white" />
                                </svg>
                            </div>
                        </div>
                    ) : (
                        /* Static pin */
                        <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
                            <ellipse cx="40" cy="92" rx="16" ry="6" fill="#1A1A2E" opacity="0.12" />
                            <path
                                d="M40 4C24.536 4 12 16.536 12 32c0 20 28 60 28 60s28-40 28-60C68 16.536 55.464 4 40 4z"
                                fill="url(#pinGrad)"
                            />
                            <circle cx="40" cy="32" r="12" fill="white" opacity="0.9" />
                            <circle cx="40" cy="32" r="6" fill="#FF6B35" />
                            <defs>
                                <linearGradient id="pinGrad" x1="40" y1="4" x2="40" y2="92" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#FF6B35" />
                                    <stop offset="1" stopColor="#E85A24" />
                                </linearGradient>
                            </defs>
                        </svg>
                    )}
                </div>

                {/* Status text */}
                <div className="mt-8 text-center px-8">
                    {phase === 'idle' && (
                        <>
                            <h1 className="text-[#1A1A2E] font-black text-2xl mb-2">
                                Where do you want your service?
                            </h1>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                We&apos;ll show you the best repair experts near you
                            </p>
                        </>
                    )}

                    {phase === 'requesting' && (
                        <>
                            <h2 className="text-[#1A1A2E] font-bold text-xl mb-2">Requesting access…</h2>
                            <p className="text-gray-400 text-sm">Please allow location when prompted</p>
                        </>
                    )}

                    {phase === 'locating' && (
                        <>
                            <h2 className="text-[#1A1A2E] font-bold text-xl mb-2">Locating you…</h2>
                            {detectedLabel ? (
                                <p className="text-[#FF6B35] font-semibold text-base mt-1 animate-fade-in">
                                    📍 {detectedLabel}
                                </p>
                            ) : (
                                <p className="text-gray-400 text-sm">Getting your exact location</p>
                            )}
                        </>
                    )}

                    {phase === 'denied' && (
                        <>
                            <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🚫</span>
                            </div>
                            <h2 className="text-[#1A1A2E] font-bold text-xl mb-2">Location Access Denied</h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-5">
                                QuickFix needs your location to show nearby repair shops.
                                {isNativePlatform()
                                    ? ' Please enable it in App Settings → Permissions → Location.'
                                    : ' Please allow location access in your browser settings.'}
                            </p>
                            {isNativePlatform() && (
                                <button
                                    onClick={openAppSettings}
                                    className="px-6 py-2.5 rounded-full border-2 border-[#FF6B35] text-[#FF6B35] font-bold text-sm mb-3 active:scale-95 transition-transform"
                                >
                                    Open App Settings
                                </button>
                            )}
                        </>
                    )}

                    {phase === 'error' && (
                        <>
                            <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h2 className="text-[#1A1A2E] font-bold text-xl mb-2">Couldn&apos;t Get Location</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">{errorMsg}</p>
                        </>
                    )}

                    {/* Manual input */}
                    {phase === 'manual' && (
                        <>
                            <h2 className="text-[#1A1A2E] font-bold text-xl mb-5">Enter your area</h2>
                            <div className="flex gap-2">
                                <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3.5 border-2 border-[#FF6B35]/60">
                                    <svg width="16" height="16" fill="#FF6B35" viewBox="0 0 24 24">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                    </svg>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={manualInput}
                                        onChange={e => setManualInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleManualConfirm()}
                                        placeholder="e.g. Koramangala, Bangalore"
                                        className="flex-1 bg-transparent text-[#1A1A2E] placeholder:text-gray-400 outline-none text-sm font-medium"
                                    />
                                    {manualInput && (
                                        <button onClick={() => setManualInput('')} className="text-gray-400">
                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M18 6 6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={handleManualConfirm}
                                    disabled={manualInput.trim().length < 3}
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                                    style={{ background: 'linear-gradient(135deg, #FF6B35, #E85A24)' }}
                                >
                                    <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Bottom action buttons ── */}
            <div className="px-6 pb-10 space-y-3">
                {(phase === 'idle' || phase === 'error' || phase === 'denied') && (
                    <>
                        {/* Primary CTA */}
                        {phase !== 'denied' && (
                            <button
                                id="btn-use-current-location"
                                onClick={handleUseCurrentLocation}
                                className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #FF6B35, #E85A24)' }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="white" />
                                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                {phase === 'error' ? 'Try Again' : 'At my current location'}
                            </button>
                        )}

                        {/* Secondary: manual */}
                        <button
                            id="btn-enter-manually"
                            onClick={() => setPhase('manual')}
                            className="w-full py-4 rounded-2xl font-semibold text-[#FF6B35] text-base border-2 border-[#FF6B35]/30 bg-orange-50 active:scale-95 transition-all"
                        >
                            I&apos;ll enter my location manually
                        </button>
                    </>
                )}

                {phase === 'manual' && (
                    <button
                        onClick={() => setPhase('idle')}
                        className="w-full py-3 rounded-2xl font-semibold text-gray-500 text-sm active:scale-95 transition-all hover:bg-gray-50"
                    >
                        ← Use GPS instead
                    </button>
                )}

                {(phase === 'requesting' || phase === 'locating') && (
                    <p className="text-center text-gray-400 text-xs">Please wait…</p>
                )}
            </div>

            {/* Keyframe styles */}
            <style>{`
                @keyframes pulse-ring {
                    0%, 100% { transform: scale(1); opacity: 0.06; }
                    50%       { transform: scale(1.3); opacity: 0.03; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

// ── Page export with Suspense (required for useSearchParams in App Router) ─────
export default function LocationSetupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full"
                    style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        }>
            <LocationSetupInner />
        </Suspense>
    )
}
