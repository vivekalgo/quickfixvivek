'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import StatusBadge from '@/components/StatusBadge'
import AuthGuard from '@/components/AuthGuard'
import { BookingStatus, supabase } from '@/lib/data'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TABS: { key: 'all' | 'active' | 'completed'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
]

export default function OrdersPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all')
    const [bookingsRaw, setBookingsRaw] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [cancellingId, setCancellingId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const { user } = useAuth()

    const fetchAllBookings = async () => {
        if (!user) return
        setError(null)
        
        try {
            // 1. Fetch Normal Bookings
            const { data: normal, error: nErr } = await supabase
                .from('bookings')
                .select('*, shops(*), services(*)')
                .eq('user_id', user.uid)
            
            if (nErr) throw nErr
                
            // 2. Fetch Emergency Bookings
            const { data: emergency, error: eErr } = await supabase
                .from('emergency_bookings')
                .select('*')
                .eq('user_id', user.uid)

            if (eErr) throw eErr
    
            const combined = [
                ...(normal || []).map((b: any) => ({
                    ...b,
                    isEmergency: false,
                    shopName: b.shops?.name || 'Shop',
                    shopImage: b.shops?.images?.[0],
                    serviceName: b.services?.name || 'Service',
                })),
                ...(emergency || []).map((e: any) => ({
                    ...e,
                    isEmergency: true,
                    shopName: 'Emergency Support',
                    serviceName: e.problem_title || 'Emergency Service',
                    service_price: e.emergency_charge,
                }))
            ].sort((a, b) => {
                const dateA = new Date(`${a.date || ''} ${a.time || ''}`).getTime()
                const dateB = new Date(`${b.date || ''} ${b.time || ''}`).getTime()
                return (dateB || 0) - (dateA || 0)
            })
    
            setBookingsRaw(combined)
        } catch (err: any) {
            console.error('Fetch Orders Error:', err)
            setError(err.message || 'Failed to load orders. Please check your connection.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!user) return
        fetchAllBookings()

        // Real-time Sync for Normal Bookings - ensure filter is valid
        const normalSub = supabase.channel(`my-orders-normal-${user.uid}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'bookings', 
                filter: `user_id=eq.${user.uid}` 
            }, () => fetchAllBookings())
            .subscribe()

        // Real-time Sync for Emergency Bookings
        const emergencySub = supabase.channel(`my-orders-emergency-${user.uid}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'emergency_bookings', 
                filter: `user_id=eq.${user.uid}` 
            }, () => fetchAllBookings())
            .subscribe()

        return () => {
            supabase.removeChannel(normalSub)
            supabase.removeChannel(emergencySub)
        }
    }, [user?.uid])

    const handleCancel = async (id: string) => {
        setIsProcessing(true)
        try {
            const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
            if (error) throw error
            
            setBookingsRaw(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
            setCancellingId(null)
        } catch (err: any) {
            console.error('Cancel Error:', err)
            alert('Failed to cancel order: ' + (err.message || 'Unknown error'))
        } finally {
            setIsProcessing(false)
        }
    }

    const bookings = bookingsRaw.filter(b => {
        if (activeTab === 'active') return !['completed', 'cancelled'].includes(b.status)
        if (activeTab === 'completed') return b.status === 'completed'
        return true
    })

    return (
        <AuthGuard>
        <div className="pb-24">
            {/* Header */}
            <div className="px-5 pt-12 pb-4 bg-white border-b border-gray-100">
                <h1 className="font-black text-[#1A1A2E] text-2xl mb-4">My Orders</h1>
                <div className="flex gap-0 bg-gray-100 rounded-2xl p-1">
                    {TABS.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white text-[#1A1A2E] shadow-sm' : 'text-gray-500'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-5 pt-4">
                {loading ? (
                    <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div></div>
                ) : error ? (
                    <div className="text-center py-20 px-10">
                        <span className="text-5xl">⚠️</span>
                        <p className="text-red-500 font-bold mt-4">{error}</p>
                        <button onClick={fetchAllBookings} className="mt-4 bg-[#1A1A2E] text-white px-6 py-2 rounded-xl font-bold active:scale-95 transition-transform">
                            Try Again
                        </button>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="text-6xl">📋</span>
                        <p className="text-gray-600 font-bold mt-4">No orders yet</p>
                        <p className="text-gray-400 text-sm">Book a service to get started</p>
                        <Link href="/" className="mt-5 inline-block bg-[#FF6B35] text-white px-6 py-3 rounded-full font-bold">
                            Browse Services
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {bookings.map(booking => {
                            const goToDetails = () => router.push(`/orders/track?id=${booking.id}`)
                            
                            return (
                                <div key={booking.id} 
                                    onClick={goToDetails}
                                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] transition-transform">
                                    <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                                        <div className={`relative w-12 h-12 ${booking.isEmergency ? 'bg-red-100' : 'bg-orange-100'} rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-xl`}>
                                            {booking.isEmergency ? '🚨' : booking.shopImage ? (
                                                <Image
                                                    src={booking.shopImage}
                                                    alt={booking.shopName}
                                                    fill
                                                    sizes="48px"
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            ) : '🏪'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-bold text-[#1A1A2E] text-sm truncate">{booking.shopName}</p>
                                                {booking.isEmergency && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">Emergency</span>}
                                            </div>
                                            <p className="text-gray-400 text-xs truncate">{booking.serviceName}</p>
                                        </div>
                                        <StatusBadge status={booking.status as BookingStatus} />
                                    </div>
                                    <div className="px-4 py-3 flex justify-between items-center">
                                        <div className="flex gap-4">
                                            <div>
                                                <p className="text-gray-400 text-[11px]">Date</p>
                                                <p className="text-[#1A1A2E] font-semibold text-xs">{booking.date}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-[11px]">Time</p>
                                                <p className="text-[#1A1A2E] font-semibold text-xs">{booking.time}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-[#FF6B35] text-lg">₹{booking.service_price || booking.servicePrice}</p>
                                            <p className={`text-[11px] font-semibold ${booking.payment_method === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {booking.payment_method === 'paid' ? '✓ Paid' : '⏳ Pending'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {['requested', 'accepted'].includes(booking.status) && (
                                        <div className="px-4 pb-4">
                                            {cancellingId === booking.id ? (
                                                <div className="bg-red-50 border border-red-100 rounded-xl p-3 animate-slide-up">
                                                    <p className="text-red-700 text-xs font-bold mb-2 text-center">Are you sure you want to cancel?</p>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleCancel(booking.id) }}
                                                            disabled={isProcessing}
                                                            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-[11px] font-black active:scale-95 disabled:opacity-50">
                                                            {isProcessing ? 'Processing...' : 'Yes, Cancel'}
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setCancellingId(null) }}
                                                            className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[11px] font-bold active:scale-95">
                                                            Keep Order
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); setCancellingId(booking.id) }} 
                                                        className="flex-1 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
                                                        Cancel Order
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); goToDetails() }} 
                                                        className="flex-1 py-2 rounded-xl text-xs font-bold text-[#1A1A2E] bg-gray-50 border border-gray-100 text-center">
                                                        Track Status
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
            <BottomNav />
        </div>
        </AuthGuard>
    )
}
