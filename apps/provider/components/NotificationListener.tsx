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

        // 1. Request permission & Setup Channel
        const setupNotifications = async () => {
            if (!Capacitor.isNativePlatform()) return
            try {
                await LocalNotifications.requestPermissions()
                await LocalNotifications.createChannel({
                    id: 'quickfix-provider-alerts',
                    name: 'Urgent Order Alerts',
                    importance: 5,
                    description: 'Alerts for incoming bookings',
                    sound: 'default',
                    vibration: true,
                    visibility: 1
                })
            } catch (e) {
                console.error('Provider local notification setup failed', e)
            }
        }
        setupNotifications()

        // 2. Listen for Notifications targeted at this Owner
        const channel = supabase
            .channel(`shop_owner_${shop.owner_id}_alerts`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${shop.owner_id}`
                },
                (payload) => {
                    handleNewNotification(payload.new)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [shop?.owner_id])

    return null
}
