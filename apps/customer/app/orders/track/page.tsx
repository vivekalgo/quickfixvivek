'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/data'
import BottomNav from '@/components/BottomNav'
import StatusBadge from '@/components/StatusBadge'

function OrderTrackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const bookingId = searchParams.get('id')

    const [booking, setBooking] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!bookingId) return
        const fetchBooking = async () => {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, shops(*), services(*)')
                .eq('id', bookingId)
                .single()

            if (data) setBooking(data)
            setLoading(false)
        }
        fetchBooking()

        // Real-time subscription for status updates
        const channel = supabase
            .channel(`booking_${bookingId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'bookings',
                filter: `id=eq.${bookingId}`
            }, (payload) => {
                setBooking((prev: any) => ({ ...prev, ...payload.new }))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [bookingId])

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    if (!booking) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <span className="text-6xl mb-4">🔍</span>
            <h1 className="text-xl font-bold text-gray-800">Booking not found</h1>
            <p className="text-gray-500 mt-2">The booking you are looking for does not exist.</p>
            <Link href="/orders" className="mt-6 bg-[#FF6B35] text-white px-6 py-2 rounded-full font-bold">Go to Orders</Link>
        </div>
    )

    const steps = [
        { key: 'requested', label: 'Requested', icon: '📝', desc: 'Awaiting shop acceptance' },
        { key: 'accepted', label: 'Accepted', icon: '🤝', desc: 'Shop has accepted your booking' },
        { key: 'on-the-way', label: 'On the Way', icon: '🚗', desc: 'Technician is heading to you' },
        { key: 'completed', label: 'Completed', icon: '✅', desc: 'Service successfully finished' },
    ]

    const currentStepIdx = steps.findIndex(s => s.key === booking.status)
    const isCancelled = booking.status === 'cancelled'

    return (
        <div className="pb-32 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="px-5 pt-12 pb-6 bg-[#1A1A2E] text-white">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div>
                        <h1 className="font-black text-xl">Track Order</h1>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5">Booking ID: #{booking.id.slice(-6)}</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white/10 shrink-0 border border-white/10">
                            {booking.shops?.images?.[0] && (
                                <Image src={booking.shops.images[0]} alt={booking.shops.name} fill className="object-cover" unoptimized />
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="font-black text-lg text-white">{booking.shops?.name}</h2>
                            <p className="text-white/60 text-xs font-medium">{booking.services?.name}</p>
                        </div>
                        <StatusBadge status={booking.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div>
                            <p className="text-white/30 text-[10px] font-bold uppercase">Scheduled for</p>
                            <p className="text-white text-sm font-bold mt-0.5">{booking.date} at {booking.time}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/30 text-[10px] font-bold uppercase">Total Bill</p>
                            <p className="text-[#FF6B35] text-xl font-black mt-0.5">₹{booking.service_price}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 mt-6">
                {isCancelled ? (
                    <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center animate-fade-in">
                        <span className="text-5xl mb-4 block">❌</span>
                        <h3 className="text-red-800 font-black text-lg">Order Cancelled</h3>
                        <p className="text-red-600/70 text-sm mt-1">This booking has been cancelled and is no longer being processed.</p>
                        <Link href="/" className="mt-6 inline-block bg-white border border-red-200 text-red-600 px-8 py-2.5 rounded-2xl font-bold text-sm">Find Another Shop</Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm shadow-gray-200/20">
                        <h3 className="text-[#1A1A2E] font-black mb-6">Service Status</h3>
                        <div className="space-y-0 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100"></div>
                            
                            {steps.map((step, idx) => {
                                const isDone = idx <= currentStepIdx
                                const isCurrent = idx === currentStepIdx
                                
                                return (
                                    <div key={step.key} className={`flex items-start gap-4 pb-8 last:pb-0 transition-opacity duration-500 ${isDone ? 'opacity-100' : 'opacity-30'}`}>
                                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg border-4 transition-all duration-500 ${isCurrent ? 'bg-[#FF6B35] border-orange-100 scale-110 shadow-lg shadow-orange-500/20' : isDone ? 'bg-emerald-500 border-emerald-50' : 'bg-gray-100 border-white'}`}>
                                            {isDone && !isCurrent ? '✓' : step.icon}
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <p className={`text-sm font-black ${isDone ? 'text-[#1A1A2E]' : 'text-gray-400'}`}>{step.label}</p>
                                            <p className="text-gray-400 text-[11px] font-medium mt-0.5">{step.desc}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm shadow-gray-200/20">
                    <h3 className="text-[#1A1A2E] font-black mb-4">Service Details</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <span className="text-xl shrink-0">📍</span>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service Address</p>
                                <p className="text-sm font-bold text-[#1A1A2E] mt-0.5">{booking.address}</p>
                            </div>
                        </div>
                        {booking.description && (
                            <div className="flex items-start gap-3">
                                <span className="text-xl shrink-0">💬</span>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">User Notes</p>
                                    <p className="text-sm font-bold text-[#1A1A2E] mt-0.5">{booking.description}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-start gap-3">
                            <span className="text-xl shrink-0">💳</span>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Method</p>
                                <p className="text-sm font-bold text-[#1A1A2E] mt-0.5 uppercase">{booking.payment_method}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 p-6 bg-[#FF6B35]/10 rounded-3xl border border-[#FF6B35]/20 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">📞</div>
                    <div className="flex-1">
                        <p className="text-[#1A1A2E] font-black text-sm">Need help?</p>
                        <p className="text-[#FF6B35] text-xs font-bold">Contact shop at {booking.shops?.phone}</p>
                    </div>
                    <a href={`tel:${booking.shops?.phone}`} className="bg-[#FF6B35] text-white p-3 rounded-xl shadow-lg shadow-orange-500/30 active:scale-90 transition-transform">
                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    </a>
                </div>
            </div>

            <BottomNav />
        </div>
    )
}

export default function OrderTrackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <OrderTrackContent />
        </Suspense>
    )
}
