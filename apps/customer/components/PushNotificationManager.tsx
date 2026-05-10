'use client'
import { useEffect } from 'react'
import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { supabase } from '@/lib/data'
import { useAuth } from '@/lib/AuthContext'

export default function PushNotificationManager() {
    const { user } = useAuth()

    useEffect(() => {
        if (!user || !Capacitor.isNativePlatform()) return

        const registerPush = async () => {
            try {
                // 1. Request permission
                let permStatus = await PushNotifications.checkPermissions()
                
                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions()
                }

                if (permStatus.receive !== 'granted') {
                    console.warn('Push notification permission denied')
                    return
                }

                // 1.5 Create a high-importance channel for Android
                await PushNotifications.createChannel({
                    id: 'alerts',
                    name: 'Service Alerts',
                    description: 'Notifications for your service status',
                    sound: 'default',
                    importance: 5,
                    visibility: 1,
                    vibration: true
                })

                // 2. Register with FCM/APNS
                await PushNotifications.register()

                // 3. Listen for token registration
                PushNotifications.addListener('registration', async (token) => {
                    console.log('Push Registration Success, Token:', token.value)
                    
                    // Update user's FCM token in Supabase for targeted pushes
                    await supabase
                        .from('users')
                        .update({ fcm_token: token.value })
                        .eq('id', user.uid)
                })

                PushNotifications.addListener('registrationError', (error) => {
                    console.error('Push Registration Error:', JSON.stringify(error))
                })

                // 4. Handle incoming notifications while app is open
                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push received:', notification)
                    // If app is open, standard Capacitor logic shows the notification
                })

            } catch (err) {
                console.error('Push Notification Setup Error:', err)
            }
        }

        registerPush()

        return () => {
            PushNotifications.removeAllListeners()
        }
    }, [user])

    return null
}
