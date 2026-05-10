// Shared types and seed data for QuickFix
export { supabase } from './supabase';

export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
    password?: string;
    role: UserRole;
    avatar?: string;
    address?: string;
    createdAt: string;
    isBlocked?: boolean;
}

export interface Service {
    id: string;
    shopId: string;
    name: string;
    description: string;
    price: number;
    duration: string; // e.g. "30 mins", "1-2 hours"
    category: ServiceCategory;
}

export type ServiceCategory =
    | 'mobile-repair'
    | 'laptop-repair'
    | 'electrician'
    | 'plumber'
    | 'ac-repair'
    | 'appliance-repair';

export interface Review {
    id: string;
    userId: string;
    userName: string;
    shopId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface Shop {
    id: string;
    name: string;
    ownerId: string;
    ownerName: string;
    category: ServiceCategory[];
    lat: number;
    lng: number;
    address: string;
    city: string;
    rating: number;
    totalReviews: number;
    priceRange: string; // e.g. "₹100 - ₹500"
    images: string[];
    services: Service[];
    reviews: Review[];
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    isApproved: boolean;
    isBlocked: boolean;
    phone: string;
    distance?: number; // km, computed at runtime
    createdAt: string;
}

export type BookingStatus =
    | 'requested'
    | 'accepted'
    | 'on-the-way'
    | 'in-progress'
    | 'completed'
    | 'cancelled';

export interface Booking {
    id: string;
    userId: string;
    userName: string;
    shopId: string;
    shopName: string;
    serviceId: string;
    serviceName: string;
    servicePrice: number;
    status: BookingStatus;
    date: string;
    time: string;
    address: string;
    description: string;
    paymentMethod: 'cash' | 'upi';
    paymentStatus: 'pending' | 'paid';
    createdAt: string;
    updatedAt: string;
}

// ── SEED DATA ──────────────────────────────────────────────────────────────

export const CATEGORIES: { id: ServiceCategory; label: string; icon: string; color: string }[] = [
    { id: 'mobile-repair', label: 'Mobile Repair', icon: '📱', color: '#FF6B35' },
    { id: 'laptop-repair', label: 'Laptop Repair', icon: '💻', color: '#6366F1' },
    { id: 'electrician', label: 'Electrician', icon: '⚡', color: '#EAB308' },
    { id: 'plumber', label: 'Plumber', icon: '🔧', color: '#0EA5E9' },
    { id: 'ac-repair', label: 'AC Repair', icon: '❄️', color: '#06B6D4' },
    { id: 'appliance-repair', label: 'Appliance Repair', icon: '🔌', color: '#10B981' },
];
