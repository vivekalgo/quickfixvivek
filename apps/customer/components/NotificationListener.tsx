'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/data'
import { useAuth } from '@/lib/AuthContext'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

export default function NotificationListener() {
    const { user } = useAuth()

    useEffect(() => {
        if (!user) return

        const handleNewNotification = async (notif: any) => {
            // Web Fallback: Show a simple alert if not on mobile
            if (!Capacitor.isNativePlatform()) {
                alert(`📢 ${notif.title}\n\n${notif.message}`)
                return
            }

            try {
                // Trigger a native system notification
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: notif.title,
                            body: notif.message,
                            id: Math.floor(Math.random() * 10000),
                            schedule: { at: new Date(Date.now() + 1000) },
                            sound: 'default',
                            attachments: [],
                            actionTypeId: '',
                            extra: null
                        }
                    ]
                })
            } catch (e) {
                console.error('Failed to show local notification', e)
            }
        }

        // 1. Request permission for local notifications
        LocalNotifications.requestPermissions()

        // 2. Listen for new notifications in Supabase
        const channel = supabase
            .channel('notifications-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.uid}`
                },
                (payload) => {
                    handleNewNotification(payload.new)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    return null // This component doesn't render anything
}
