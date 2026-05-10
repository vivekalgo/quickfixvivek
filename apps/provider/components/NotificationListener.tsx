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

        // 2. Listen for new notifications for the shop owner
        const channel = supabase
            .channel('notifications-channel')
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
