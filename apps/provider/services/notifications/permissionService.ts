import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const NotificationPermissionService = {
  async requestAllPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      // 1. Push Notifications Permissions
      const pushStatus = await PushNotifications.requestPermissions();
      if (pushStatus.receive !== 'granted') {
        console.warn('Push notification permission denied');
      }

      // 2. Local Notifications Permissions (Required for some Android versions)
      const localStatus = await LocalNotifications.requestPermissions();
      if (localStatus.display !== 'granted') {
        console.warn('Local notification permission denied');
      }

      return pushStatus.receive === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  async checkStatus(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    const status = await PushNotifications.checkPermissions();
    return status.receive === 'granted';
  }
};
