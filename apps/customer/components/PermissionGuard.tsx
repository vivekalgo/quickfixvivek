'use client'
import React, { useState, useEffect } from 'react'
import { Geolocation } from '@capacitor/geolocation'
import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'

export default function PermissionGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<{
        location: string;
        notifications: string;
    }>({ location: 'prompt', notifications: 'prompt' })
    const [loading, setLoading] = useState(true)
    const [showOverlay, setShowOverlay] = useState(false)

    useEffect(() => {
        const checkPermissions = async () => {
            if (!Capacitor.isNativePlatform()) {
                setLoading(false)
                return
            }

            try {
                // Check Location
                const locStatus = await Geolocation.checkPermissions()
                
                // Check Notifications
                const notifStatus = await PushNotifications.checkPermissions()

                setStatus({
                    location: locStatus.location,
                    notifications: notifStatus.receive
                })

                if (locStatus.location !== 'granted' || notifStatus.receive !== 'granted') {
                    setShowOverlay(true)
                }
            } catch (e) {
                console.error('Permission check failed', e)
            } finally {
                setLoading(false)
            }
        }

        checkPermissions()
    }, [])

    const requestAll = async () => {
        setLoading(true)
        try {
            if (Capacitor.isNativePlatform()) {
                await Geolocation.requestPermissions()
                await PushNotifications.requestPermissions()
                
                // Re-check status instead of reloading
                const locStatus = await Geolocation.checkPermissions()
                const notifStatus = await PushNotifications.checkPermissions()
                
                setStatus({
                    location: locStatus.location,
                    notifications: notifStatus.receive
                })

                if (locStatus.location === 'granted' && notifStatus.receive === 'granted') {
                    setShowOverlay(false)
                }
            } else {
                setShowOverlay(false)
            }
        } catch (e) {
            console.error('Permission request failed', e)
        } finally {
            setLoading(false)
        }
    }

    if (loading && !showOverlay) return null

    if (showOverlay) {
        return (
            <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-between p-8 text-center animate-fade-in">
                <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-sm">
                    <div className="relative">
                        <div className="w-24 h-24 bg-[#FF6B35]/10 rounded-[32px] flex items-center justify-center animate-pulse">
                            <span className="text-5xl">📍</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center border-4 border-white">
                            <span className="text-xl">🔔</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-2xl font-black text-[#1A1A2E]">Enhance Your Experience</h1>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">
                            To find the best local services near you and track your orders in real-time, we need your permission.
                        </p>
                    </div>

                    <div className="w-full space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl text-left border border-gray-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                <span className="text-lg">🗺️</span>
                            </div>
                            <div>
                                <p className="font-bold text-[#1A1A2E] text-sm">Location Access</p>
                                <p className="text-[11px] text-gray-400 font-medium">Find shops and technicians nearby</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl text-left border border-gray-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                <span className="text-lg">📱</span>
                            </div>
                            <div>
                                <p className="font-bold text-[#1A1A2E] text-sm">Notifications</p>
                                <p className="text-[11px] text-gray-400 font-medium">Real-time status of your bookings</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-sm space-y-4 mb-4">
                    <button 
                        onClick={requestAll}
                        disabled={loading}
                        className="w-full bg-[#FF6B35] text-white py-5 rounded-2xl font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-lg"
                    >
                        {loading ? 'Processing...' : 'Allow & Continue'}
                    </button>
                    <button 
                        onClick={() => setShowOverlay(false)}
                        className="w-full text-gray-400 py-2 rounded-xl font-bold text-sm"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
