'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase, CATEGORIES } from '@/lib/data'
import { isShopOpen } from '@/lib/timeUtils'
import { useAuth } from '@/lib/AuthContext'
import { getSavedLocation } from '@/lib/locationPermission'
import BottomNav from '@/components/BottomNav'

function ShopDetailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuth()
    const shopId = searchParams.get('id')

    const [shop, setShop] = useState<any>(null)
    const [categories, setCategories] = useState<any[]>(CATEGORIES)
    const [loading, setLoading] = useState(true)
    const [bookingService, setBookingService] = useState<any>(null)
    const [bookingForm, setBookingForm] = useState({
        date: '',
        time: '',
        address: '',
        lat: null as number | null,
        lng: null as number | null,
        description: '',
        paymentMethod: 'cash' as 'cash' | 'upi'
    })
    const [userAddresses, setUserAddresses] = useState<any[]>([])
    const [isBooking, setIsBooking] = useState(false)

    useEffect(() => {
        if (!shopId) {
            setLoading(false)
            return
        }
        const load = async () => {
            try {
                const { data: catData } = await supabase.from('categories').select('*')
                if (catData) setCategories(catData)

                const { data, error } = await supabase
                    .from('shops')
                    .select('*, services(*)')
                    .eq('id', shopId)
                    .single()

                if (data) setShop(data)
            } catch (err) {
                console.error('Error loading shop details:', err)
            } finally {
                setLoading(false)
            }
            
            // Fetch saved addresses if user is logged in
            if (user) {
                const { data: addrs } = await supabase
                    .from('user_addresses')
                    .select('*')
                    .eq('user_id', user.uid)
                    .order('is_default', { ascending: false })
                if (addrs) setUserAddresses(addrs)
            }
        }
        load()
    }, [shopId])

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!user) {
            router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`)
            return
        }
        
        if (!bookingService || !shop) {
            alert('Missing service or shop information. Please refresh and try again.')
            return
        }

        setIsBooking(true)
        try {
            // DIAGNOSTIC LOGGING (Task 9)
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oatjkxhymqijjhvoryfx.supabase.co'
            console.log("--- BOOKING DIAGNOSTICS ---")
            console.log("Supabase URL:", supabaseUrl)
            console.log("User UID:", user?.uid)

            // Get coordinates from form or fallback to saved location
            const loc = getSavedLocation()
            const lat = bookingForm.lat ?? (loc?.coords ? loc.coords[0] : null)
            const lng = bookingForm.lng ?? (loc?.coords ? loc.coords[1] : null)

            const payload = {
                user_id: user.uid,
                shop_id: shop.id,
                service_id: bookingService.id,
                status: 'requested',
                date: bookingForm.date,
                time: bookingForm.time,
                address: bookingForm.address,
                description: bookingForm.description,
                service_price: Number(bookingService.price),
                payment_method: bookingForm.paymentMethod,
                latitude: lat,
                longitude: lng,
                created_at: new Date().toISOString()
            }
            
            console.log('Booking Payload:', JSON.stringify(payload, null, 2))

            // 1. Perform the insert
            const { data, error } = await supabase.from('bookings').insert(payload).select('id').single()

            if (error) {
                console.error('SUPABASE ERROR:', error)
                // Specific hint for libcurl protocol errors (Task 12/14)
                if (error.message?.includes('libcurl') || error.code === 'XX000') {
                    throw new Error(`Database Protocol Error (libcurl). This is likely a server-side webhook issue. Message: ${error.message}`)
                }
                throw new Error(error.message)
            }

            console.log('Booking Success, ID:', data.id)

            // Send notification to the Provider (Shop Owner)
            await supabase.from('notifications').insert({
                user_id: shop.owner_id,
                title: 'New Service Request',
                message: `You have a new booking from ${user?.displayName || 'a customer'} for ${bookingService.name}.`,
                created_at: new Date().toISOString()
            })

            router.push(`/orders/track?id=${data.id}`)
        } catch (err: any) {
            console.error('FULL ERROR:', err)
            alert(`Booking failed: ${err.message || 'Unknown network error'}`)
            setIsBooking(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    if (!shop) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <span className="text-6xl mb-4">🏜️</span>
            <h1 className="text-xl font-bold text-gray-800">Shop not found</h1>
            <p className="text-gray-500 mt-2">The shop you are looking for does not exist or has been removed.</p>
            <Link href="/" className="mt-6 bg-[#FF6B35] text-white px-6 py-2 rounded-full font-bold">Go Home</Link>
        </div>
    )

    return (
        <div className="pb-32 bg-gray-50 min-h-screen">
            {/* Header / Image Section */}
            <div className="relative h-64 w-full">
                <Image
                    src={shop.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'}
                    alt={shop.name}
                    fill
                    className="object-cover"
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <button 
                    onClick={() => router.back()}
                    className="absolute top-12 left-5 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white active:scale-90 transition-transform"
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                
                <div className="absolute bottom-6 left-5 right-5">
                    <div className="flex items-center gap-2 mb-2">
                        {shop.category?.map((cat: string) => {
                            const c = categories.find(it => it.id === cat)
                            return (
                                <span key={cat} className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
                                    {c?.icon} {c?.label}
                                </span>
                            )
                        })}
                    </div>
                    <h1 className="text-2xl font-black text-white leading-tight">{shop.name}</h1>
                    <div className="flex items-center gap-3 mt-2 text-white/80 text-xs font-medium">
                        <span className="flex items-center gap-1">⭐ {shop.rating} ({shop.total_reviews} reviews)</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">📍 {shop.city}</span>
                    </div>
                </div>
            </div>

            {/* Shop Info Content */}
            <div className="px-5 -mt-4 relative z-10">
                <div className="bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isShopOpen(shop.open_time, shop.close_time) ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-400'}`}></span>
                            <span className={`text-xs font-black tracking-wider ${isShopOpen(shop.open_time, shop.close_time) ? 'text-emerald-600' : 'text-gray-500'}`}>
                                {isShopOpen(shop.open_time, shop.close_time) ? 'OPEN NOW' : 'CLOSED'}
                            </span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{shop.open_time} - {shop.close_time}</span>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {shop.address}
                    </p>
                    
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Price Range</p>
                            <p className="text-sm font-black text-[#1A1A2E]">{shop.price_range}</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Contact</p>
                            <p className="text-sm font-black text-[#1A1A2E]">{shop.phone}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services Section */}
            <div className="px-5 mt-8">
                <h2 className="text-lg font-black text-[#1A1A2E] mb-4">Available Services</h2>
                <div className="flex flex-col gap-3">
                    {shop.services?.map((svc: any) => (
                        <div key={svc.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="flex-1 pr-4">
                                <h3 className="font-bold text-[#1A1A2E] text-base">{svc.name}</h3>
                                <p className="text-gray-500 text-xs mt-1 line-clamp-1">{svc.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[#FF6B35] font-black text-lg">₹{svc.price}</span>
                                    {svc.duration && <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">⏱ {svc.duration}</span>}
                                </div>
                            </div>
                            <button 
                                onClick={() => setBookingService(svc)}
                                className="bg-[#1A1A2E] text-white px-5 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-transform shadow-lg shadow-gray-200"
                            >
                                Book
                            </button>
                        </div>
                    ))}
                    {(!shop.services || shop.services.length === 0) && (
                        <div className="text-center py-8 bg-gray-100 rounded-2xl border border-dashed border-gray-300">
                            <p className="text-gray-500 font-bold">No services listed yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Modal Overlay */}
            {bookingService && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl animate-slide-up h-[85vh] sm:h-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="font-black text-xl text-[#1A1A2E]">Confirm Booking</h2>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">{bookingService.name}</p>
                            </div>
                            <button onClick={() => setBookingService(null)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleBook} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Service Date</label>
                                    <input 
                                        type="date" 
                                        required 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-bold text-sm"
                                        value={bookingForm.date}
                                        onChange={e => setBookingForm(f => ({ ...f, date: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Service Time</label>
                                    <input 
                                        type="time" 
                                        required 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-bold text-sm"
                                        value={bookingForm.time}
                                        onChange={e => setBookingForm(f => ({ ...f, time: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Service Address</label>
                                
                                {/* Quick Select Saved Addresses */}
                                {userAddresses.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {userAddresses.map(addr => (
                                            <button
                                                key={addr.id}
                                                type="button"
                                                onClick={() => setBookingForm(f => ({ ...f, address: addr.full_address, lat: addr.latitude, lng: addr.longitude }))}
                                                className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                                                    bookingForm.address === addr.full_address 
                                                    ? 'bg-[#FF6B35] text-white border-[#FF6B35]' 
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50'
                                                }`}
                                            >
                                                {addr.type === 'Home' ? '🏠' : addr.type === 'Office' ? '🏢' : '📍'} {addr.type}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <textarea 
                                    required 
                                    rows={2}
                                    placeholder="Enter full address for doorstep service..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-bold text-sm resize-none"
                                    value={bookingForm.address}
                                    onChange={e => setBookingForm(f => ({ ...f, address: e.target.value, lat: null, lng: null }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Notes (Optional)</label>
                                <input 
                                    placeholder="Any specific issue or instructions?"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-bold text-sm"
                                    value={bookingForm.description}
                                    onChange={e => setBookingForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Payment Method</label>
                                <div className="flex gap-3">
                                    <div className="flex-1 py-4 px-4 rounded-2xl border-2 border-[#FF6B35] bg-orange-50 flex items-center justify-between shadow-sm shadow-orange-500/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">💵</span>
                                            <div>
                                                <p className="font-black text-[#1A1A2E] text-sm leading-none">Cash Payment</p>
                                                <p className="text-[9px] font-bold text-[#FF6B35] uppercase tracking-widest mt-1">Pay after service</p>
                                            </div>
                                        </div>
                                        <div className="w-5 h-5 rounded-full bg-[#FF6B35] flex items-center justify-center">
                                            <svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6">
                                <div className="bg-gray-100 rounded-2xl p-4 flex items-center justify-between mb-4">
                                    <span className="text-gray-500 font-bold text-sm">Total Amount</span>
                                    <span className="text-2xl font-black text-[#1A1A2E]">₹{bookingService.price}</span>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isBooking}
                                    className="w-full bg-[#FF6B35] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-transform disabled:opacity-50"
                                >
                                    {isBooking ? 'Confirming...' : 'Complete Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    )
}

export default function ShopDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ShopDetailContent />
        </Suspense>
    )
}
