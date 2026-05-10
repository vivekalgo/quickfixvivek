'use client'
import { useEffect } from 'react'
import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { supabase } from '@/lib/data'

export default function PushNotificationManager({ shop }: { shop: any }) {
    useEffect(() => {
        if (!shop?.owner_id || !Capacitor.isNativePlatform()) return

        const registerPush = async () => {
            try {
                // 1. Request permission
                let permStatus = await PushNotifications.checkPermissions()
                
                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions()
                }

                if (permStatus.receive !== 'granted') {
                    console.warn('Push permission denied for Provider')
                    return
                }

                // 1.5 Create a high-importance channel for Android
                await PushNotifications.createChannel({
                    id: 'orders',
                    name: 'New Order Alerts',
                    description: 'High priority alerts for incoming service requests',
                    sound: 'default',
                    importance: 5,
                    visibility: 1,
                    vibration: true
                })

                // 2. Register
                await PushNotifications.register()

                // 3. Listen for token
                PushNotifications.addListener('registration', async (token) => {
                    console.log('Provider Push Token:', token.value)
                    
                    // Save FCM token for the shop owner
                    await supabase
                        .from('users')
                        .update({ fcm_token: token.value })
                        .eq('id', shop.owner_id)
                })

                PushNotifications.addListener('registrationError', (error) => {
                    console.error('Provider Push Error:', error)
                })

            } catch (err) {
                console.error('Provider Push Setup Error:', err)
            }
        }

        registerPush()

        return () => {
            PushNotifications.removeAllListeners()
        }
    }, [shop?.owner_id])

    return null
}
