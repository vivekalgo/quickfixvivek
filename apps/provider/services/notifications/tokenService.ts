import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { supabase } from '@/lib/data';
import { Capacitor } from '@capacitor/core';

export const NotificationTokenService = {
  async registerToken(userId: string, role: 'customer' | 'provider') {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // 1. Get Device Info
      const info = await Device.getInfo();
      const deviceId = await Device.getId();

      // 2. Add listener for token registration
      PushNotifications.addListener('registration', async (token) => {
        console.log('FCM Token generated:', token.value);

        // 3. Sync with Supabase (UPSERT logic to handle multiple devices/refreshes)
        const { error } = await supabase
          .from('fcm_tokens')
          .upsert({
            user_id: userId,
            token: token.value,
            role: role,
            device_name: `${info.manufacturer} ${info.model}`,
            platform: info.platform,
            id: deviceId.identifier // Use device unique ID as PK for token record
          }, { onConflict: 'id' });

        if (error) console.error('Failed to sync FCM token with Supabase:', error);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('FCM Registration Error:', error);
      });

      // 4. Request registration
      await PushNotifications.register();
    } catch (error) {
      console.error('Token registration service failed:', error);
    }
  },

  async removeToken(deviceId: string) {
    try {
      await supabase.from('fcm_tokens').delete().eq('id', deviceId);
      await PushNotifications.removeAllListeners();
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }
};
