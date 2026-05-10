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
                            smallIcon: 'ic_stat_name', // Standard Capacitor icon name
                            channelId: 'quickfix-alerts'
                        }
                    ]
                })
            } catch (e) {
                console.error('Failed to show local notification', e)
            }
        }

        // 1. Request permission for local notifications & Setup Channel
        const setupNotifications = async () => {
            if (!Capacitor.isNativePlatform()) return
            try {
                await LocalNotifications.requestPermissions()
                await LocalNotifications.createChannel({
                    id: 'quickfix-alerts',
                    name: 'Service Updates',
                    importance: 5,
                    description: 'Alerts for booking status and messages',
                    sound: 'default',
                    visibility: 1
                })
            } catch (e) {
                console.error('Local notification setup failed', e)
            }
        }
        setupNotifications()

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
