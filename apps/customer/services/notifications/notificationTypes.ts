export type NotificationType = 
  | 'new_booking' 
  | 'emergency_booking' 
  | 'booking_accepted' 
  | 'booking_completed' 
  | 'provider_arrived' 
  | 'admin_alert'
  | 'payment_received';

export interface NotificationPayload {
  title: string;
  body: string;
  data: {
    type: NotificationType;
    bookingId?: string;
    screen?: string;
    [key: string]: any;
  };
}
