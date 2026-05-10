'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/data'
import { LocalNotifications } from '@capacitor/local-notifications'

import { Capacitor } from '@capacitor/core'

export default function NotificationListener({ shop }: { shop: any }) {
    useEffect(() => {
        if (!shop?.owner_id) return

        const handleNewNotification = async (notif: any) => {
            if (!Capacitor.isNativePlatform()) {
                return
            }
            try {
                // Ensure the channel exists for Android
                await LocalNotifications.createChannel({
                    id: 'quickfix-provider-alerts',
                    name: 'New Order Alerts',
                    importance: 5,
                    description: 'Alerts for incoming bookings',
                    sound: 'default',
                    visibility: 1
                })

                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: notif.title,
                            body: notif.message,
                            id: Math.floor(Math.random() * 10000),
                            schedule: { at: new Date(Date.now() + 500) },
                            sound: 'default',
                            smallIcon: 'ic_stat_name',
                            channelId: 'quickfix-provider-alerts'
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
                        message: `New booking for your shop. Open app to view.`
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(bookingChannel)
        }
    }, [shop?.owner_id])

    return null
}
