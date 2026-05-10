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
                // 1. Check permission only
                const permStatus = await PushNotifications.checkPermissions()
                
                if (permStatus.receive !== 'granted') {
                    // Don't request here, let PermissionGuard handle it
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
                // IMPORTANT: Native registration will crash the app if google-services.json (Android) 
                // or GoogleService-Info.plist (iOS) is missing in the native folders.
                // Disabling for now to prevent crashes. Re-enable after adding the files.
                /*
                await PushNotifications.register()
                */
               console.log('Push Registration skipped: Missing native config files.')

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
