'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/data'
import { LocalNotifications } from '@capacitor/local-notifications'

import { Capacitor } from '@capacitor/core'

export default function NotificationListener({ shop }: { shop: any }) {
    useEffect(() => {
        if (!shop?.owner_id) return

        const handleNewNotification = async (notif: any) => {
            // Web Fallback: Show a simple alert if not on mobile
            if (!Capacitor.isNativePlatform()) {
                alert(`📣 BROADCAST: ${notif.title}\n\n${notif.message}`)
                return
            }
            try {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: notif.title,
                            body: notif.message,
                            id: Math.floor(Math.random() * 10000),
                            schedule: { at: new Date(Date.now() + 500) },
                            sound: 'default',
                            attachments: [],
                            actionTypeId: '',
                            extra: null
                        }
                    ]
                })
            } catch (e) {
                console.error('Failed to show notification', e)
            }
        }

        // 1. Request permission
        if (Capacitor.isNativePlatform()) {
            LocalNotifications.requestPermissions()
        }

        // 2. Listen for Normal Bookings (Instant Alert)
        const bookingChannel = supabase
            .channel(`shop_${shop.id}_alerts`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bookings',
                    filter: `shop_id=eq.${shop.id}`
                },
                (payload) => {
                    handleNewNotification({
                        title: '🔔 New Order Received!',
                        message: `New booking for shop. Check your incoming orders.`
                    })
                }
            )
            .subscribe()

        // 3. Listen for Emergency Bookings (High Priority Alert)
        const emergencyChannel = supabase
            .channel('emergency_alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'emergency_bookings'
                },
                (payload) => {
                    handleNewNotification({
                        title: '🚨 EMERGENCY REQUEST!',
                        message: `New emergency: ${payload.new.problem_title}. Respond immediately!`
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(bookingChannel)
            supabase.removeChannel(emergencyChannel)
        }
    }, [shop?.owner_id])

    return null
}
