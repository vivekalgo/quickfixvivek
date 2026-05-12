import { PushNotifications, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const NotificationHandlerService = {
  setupHandlers(router: any) {
    if (!Capacitor.isNativePlatform()) return;

    // 1. Foreground Notification Handling
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push received in foreground:', notification);
      
      // We often want to show a local notification so the user sees a heads-up alert
      // while they are actively using the app.
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || 'New Update',
            body: notification.body || '',
            id: Math.floor(Math.random() * 10000),
            extra: notification.data,
            channelId: 'quickfix-alerts',
            smallIcon: 'ic_stat_name',
          }
        ]
      });
    });

    // 2. Action Handling (Deep Linking)
    const handleAction = (data: any) => {
      if (!data) return;
      
      console.log('Handling notification action with data:', data);

      if (data.type === 'new_booking' || data.type === 'booking_accepted') {
        router.push(`/orders/track?id=${data.bookingId}`);
      } else if (data.type === 'admin_alert') {
        router.push('/notifications');
      } else if (data.screen) {
        router.push(data.screen);
      }
    };

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      handleAction(action.notification.data);
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      handleAction(action.notification.extra);
    });
  }
};
