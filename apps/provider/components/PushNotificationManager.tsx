'use client'
import { useEffect } from 'react'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { supabase } from '@/lib/data'

export default function PushNotificationManager({ shop }: { shop: any }) {
    useEffect(() => {
        if (!shop?.owner_id || !Capacitor.isNativePlatform()) return

        const registerPush = async () => {
            try {
                // 1. Check & request permission
                let permStatus = await PushNotifications.checkPermissions()
                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions()
                }
                
                if (permStatus.receive !== 'granted') {
                    console.warn('Push permission not granted:', permStatus.receive)
                    return
                }

                // 1.5 Create a high-importance channel for Android with custom sound
                await PushNotifications.createChannel({
                    id: 'orders',
                    name: 'New Order Alerts',
                    description: 'High priority alerts for incoming service requests',
                    sound: 'incoming_order',
                    importance: 5,
                    visibility: 1,
                    vibration: true
                })

                // 2. Register
                try {
                    await PushNotifications.register()
                    console.log('Provider Push Registration Success.')
                } catch (regErr) {
                    console.warn('Provider Push Registration failed.', regErr)
                }

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

                // 4. Handle incoming notifications while app is open
                PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                    console.log('Provider Push received:', notification)
                    
                    // Trigger loud local notification in foreground!
                    try {
                        await LocalNotifications.schedule({
                            notifications: [
                                {
                                    title: notification.title || 'New Service Request',
                                    body: notification.body || 'You have a new booking request.',
                                    id: Math.floor(Math.random() * 10000),
                                    schedule: { at: new Date(Date.now() + 500) },
                                    sound: 'incoming_order',
                                    smallIcon: 'ic_stat_name',
                                    channelId: 'orders',
                                    extra: notification.data || {}
                                }
                            ]
                        })
                    } catch (err) {
                        console.error('Foreground local schedule failed:', err)
                    }
                })

                // 5. Handle notification click actions
                PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                    console.log('Provider Push action performed:', action)
                    const data = action.notification.data
                    if (data?.bookingId) {
                        window.location.href = `/orders/track?id=${data.bookingId}`
                    }
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
