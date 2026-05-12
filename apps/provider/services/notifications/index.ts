import { NotificationPermissionService } from './permissionService';
import { NotificationTokenService } from './tokenService';
import { NotificationHandlerService } from './notificationHandler';
import { NotificationType, NotificationPayload } from './notificationTypes';

export const NotificationService = {
  async initialize(userId: string, role: 'customer' | 'provider', router: any) {
    // 1. Request Permissions
    const granted = await NotificationPermissionService.requestAllPermissions();
    if (!granted) return;

    // 2. Register Token & Sync with Supabase
    await NotificationTokenService.registerToken(userId, role);

    // 3. Setup Handlers (Deep linking & Foreground alerts)
    NotificationHandlerService.setupHandlers(router);
    
    console.log('Notification Service Initialized Successfully');
  },

  types: {} as NotificationType,
};

export * from './notificationTypes';
export * from './permissionService';
export * from './tokenService';
export * from './notificationHandler';
