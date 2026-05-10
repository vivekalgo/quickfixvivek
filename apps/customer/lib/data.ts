// Re-export seed data from packages/data for use within the customer app
// In production, this would connect to a database

export {
    CATEGORIES,
    supabase,
} from '../../../packages/data/src/index'

export type {
    User,
    UserRole,
    Service,
    ServiceCategory,
    Review,
    Shop,
    Booking,
    BookingStatus,
} from '../../../packages/data/src/index'
