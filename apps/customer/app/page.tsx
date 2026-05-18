// ── Customer App Home Page ──────────────────────────────────────────────────
'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/components/BottomNav'
import ShopCard from '@/components/ShopCard'
import LocationPicker from '@/components/LocationPicker'
import LoginPromptModal from '@/components/LoginPromptModal'
import AuthGuard from '@/components/AuthGuard'
import { CATEGORIES, supabase } from '@/lib/data'
import {
    getSavedLocation,
    saveLocation,
    isLocationStale,
    getCurrentPosition,
    reverseGeocode,
} from '@/lib/locationPermission'

// Banners are now loaded from Supabase in real-time

export default function HomePage() {
    const router = useRouter()
    const { user } = useAuth()
    const userName = user?.displayName ? user.displayName.split(' ')[0] : (user?.phone || 'there')

    // Location state — always loaded from storage (set by /location-setup)
    const [location, setLocation] = useState('Detecting…')
    const [position, setPosition] = useState<[number, number] | null>(null)
    const [isLocationOpen, setIsLocationOpen] = useState(false)

    // UI state
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [bannerIdx, setBannerIdx] = useState(0)
    const [shops, setShops] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>(CATEGORIES)
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)

    // Fetch unread notifications count
    useEffect(() => {
        if (!user) return
        const fetchUnread = async () => {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.uid)
                .eq('is_read', false)
            setUnreadCount(count || 0)
        }
        fetchUnread()

        const sub = supabase.channel(`unread-count-${user.uid}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.uid}` }, () => fetchUnread())
            .subscribe()
        
        return () => { supabase.removeChannel(sub) }
    }, [user?.uid])

    // ── Load saved location from storage ────────────────────────────────────
    useEffect(() => {
        const saved = getSavedLocation()
        if (saved) {
            setLocation(saved.label)
            if (saved.coords) setPosition(saved.coords)
        } else {
            // No location set — LocationGate in ClientProviders will redirect to /location-setup
            // This branch should rarely be hit due to the gate
            router.replace('/location-setup?returnTo=/')
        }
    }, [router])

    // ── Background stale location refresh ───────────────────────────────────
    // If saved location is > 30 min old AND we have GPS permission, silently refresh
    const refreshStaleLocation = useCallback(async () => {
        if (!isLocationStale()) return
        const result = await getCurrentPosition()
        if (!result.ok) return
        const label = await reverseGeocode(result.coords[0], result.coords[1])
        saveLocation(label, result.coords)
        setLocation(label)
        setPosition(result.coords)
    }, [])

    useEffect(() => {
        refreshStaleLocation()
    }, [refreshStaleLocation])

    // ── Fetch shops + categories + banner timer ──────────────────────────────
    const [banners, setBanners] = useState<any[]>([])

    // ... inside useEffect for data loading
    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            // Fetch categories first
            const { data: catData } = await supabase.from('categories').select('*').order('order')
            if (catData && catData.length > 0) setCategories(catData)

            const { data: bannerData } = await supabase.from('banners').select('*').order('created_at', { ascending: false })
            if (bannerData && bannerData.length > 0) setBanners(bannerData)

            const { data: shopData } = await supabase.from('shops').select('*, services(*)')
            if (shopData) setShops(shopData)
            setLoading(false)
        }
        loadData()

        // Real-time Banners
        const channel = supabase.channel('banners-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setBanners(prev => [payload.new, ...prev])
                } else if (payload.eventType === 'DELETE') {
                    setBanners(prev => prev.filter(b => b.id !== payload.old.id))
                } else if (payload.eventType === 'UPDATE') {
                    setBanners(prev => prev.map(b => b.id === payload.new.id ? payload.new : b))
                }
            })
            .subscribe()

        const timer = setInterval(() => {
            setBanners(prev => {
                if (prev.length === 0) return prev
                setBannerIdx(i => (i + 1) % prev.length)
                return prev
            })
        }, 4000)
        
        return () => {
            clearInterval(timer)
            supabase.removeChannel(channel)
        }
    }, [])

    // ── LocationPicker callback ──────────────────────────────────────────────
    const handleLocationSelect = (loc: string, pos?: [number, number]) => {
        setLocation(loc)
        saveLocation(loc, pos)
        if (pos) setPosition(pos)
    }

    // ── Haversine distance ───────────────────────────────────────────────────
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
        return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1))
    }

    const filteredShops = shops.map(shop => {
        let distance = null
        if (position && shop.latitude && shop.longitude) {
            distance = getDistance(position[0], position[1], shop.latitude, shop.longitude)
        }
        return { ...shop, distance }
    }).filter(shop => {
        const matchCat = activeCategory === 'all' || shop.category?.includes(activeCategory)
        const matchSearch = !search || shop.name.toLowerCase().includes(search.toLowerCase()) ||
            shop.services?.some((s: any) => s.name.toLowerCase().includes(search.toLowerCase()))
        const matchRadius = shop.distance === null || shop.distance < 50
        return matchCat && matchSearch && shop.is_approved && matchRadius
    }).sort((a, b) => {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance
        return 0
    })

    // ── Greeting based on time ───────────────────────────────────────────────
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    return (
        <div className="pb-24">
            {/* ── Header ── */}
            <div className="px-5 pt-12 pb-4" style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #0F3460 100%)' }}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-white/60 text-xs font-medium">{greeting},</p>
                        <h1 className="text-white text-xl font-black">Hey, {userName}! 👋</h1>
                    </div>
                    <Link href="/notifications" className="relative">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B35] rounded-full text-white text-[9px] font-bold flex items-center justify-center animate-bounce-subtle">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Link>
                </div>

                {/* ── Location pill — tappable to change ── */}
                <button
                    onClick={() => setIsLocationOpen(true)}
                    suppressHydrationWarning
                    className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-4 w-full text-left active:scale-95 transition-transform hover:bg-white/20"
                >
                    <svg width="14" height="14" fill="#FF6B35" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span className="text-white text-xs font-medium flex-1 truncate">{location}</span>
                    <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </button>

                {/* ── Search ── */}
                <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-lg">
                    <svg width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        suppressHydrationWarning
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search for services, shops..."
                        className="flex-1 text-gray-700 placeholder:text-gray-400 outline-none text-sm bg-transparent font-medium"
                    />
                </div>
            </div>

            <div className="px-5">
                {/* ── Banner Carousel ── */}
                {banners.length > 0 && (
                    <div className="mt-5 mb-5 overflow-hidden rounded-2xl">
                        <div className={`bg-gradient-to-r ${banners[bannerIdx]?.bg_color || 'from-orange-500 to-red-500'} rounded-2xl p-5 flex items-center justify-between transition-all duration-500`}>
                            <div>
                                <p className="text-white font-black text-lg leading-tight">{banners[bannerIdx]?.title}</p>
                                <p className="text-white/80 text-xs mt-1">{banners[bannerIdx]?.subtitle}</p>
                                <button
                                    onClick={() => { if (!user) setShowLoginPrompt(true) }}
                                    className="mt-3 bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full active:scale-95 transition-transform">
                                    {banners[bannerIdx]?.button_text || 'Book Now'}
                                </button>
                            </div>
                            <span className="text-6xl">{banners[bannerIdx]?.emoji}</span>
                        </div>
                        <div className="flex gap-1.5 justify-center mt-2">
                            {banners.map((_, i) => (
                                <div key={i} onClick={() => setBannerIdx(i)}
                                    className={`h-1.5 rounded-full cursor-pointer transition-all ${i === bannerIdx ? 'w-5 bg-[#FF6B35]' : 'w-1.5 bg-gray-300'}`} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Categories ── */}
                <div className="mb-4">
                    <h2 className="font-bold text-[#1A1A2E] text-base mb-3">Services</h2>
                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-hide">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl shrink-0 transition-all snap-start ${activeCategory === 'all' ? 'bg-[#FF6B35] shadow-md' : 'bg-gray-100'}`}
                        >
                            <span className="text-xl">🔍</span>
                            <span className={`text-[11px] font-semibold ${activeCategory === 'all' ? 'text-white' : 'text-gray-600'}`}>All</span>
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl shrink-0 transition-all snap-start ${activeCategory === cat.id ? 'shadow-md' : 'bg-gray-100'}`}
                                style={activeCategory === cat.id ? { background: cat.color } : {}}
                            >
                                <span className="text-xl">{cat.icon}</span>
                                <span className={`text-[11px] font-semibold whitespace-nowrap ${activeCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>
                                    {cat.label.split(' ')[0]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Nearby Shops ── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-[#1A1A2E] text-base">
                            {activeCategory === 'all' ? 'Nearby Shops' : categories.find(c => c.id === activeCategory)?.label}
                            <span className="text-gray-400 text-sm font-normal ml-2">({filteredShops.length})</span>
                        </h2>
                        <Link href="/shops" className="text-[#FF6B35] text-sm font-semibold">See all</Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredShops.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="text-5xl">🥺</span>
                            <p className="text-gray-500 mt-3 font-medium">No shops found here yet</p>
                            <p className="text-gray-400 text-sm px-10 mt-1">
                                Try changing your location or search a different category.
                            </p>
                            <button
                                onClick={() => setIsLocationOpen(true)}
                                className="mt-4 text-[#FF6B35] font-semibold text-sm border border-[#FF6B35]/30 px-5 py-2 rounded-full"
                            >
                                Change Location
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {filteredShops.map((shop, i) => (
                                <div key={shop.id} className={`animate-slide-up animate-delay-${Math.min(i * 100, 300)}`}>
                                    <ShopCard shop={{
                                        ...shop,
                                        isApproved: shop.is_approved,
                                        isOpen: shop.is_open,
                                        openTime: shop.open_time,
                                        closeTime: shop.close_time,
                                        priceRange: shop.price_range
                                    }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Premium Emergency SOS Button (Circular) ── */}
            <Link 
                href="/emergency"
                className="fixed bottom-28 right-5 z-[500] group"
            >
                {/* Outer Pulsing Glow */}
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 group-hover:opacity-30"></div>
                
                {/* Main Circular Button */}
                <div className="relative bg-gradient-to-br from-red-600 to-rose-700 w-16 h-16 rounded-full shadow-[0_12px_40px_rgba(220,38,38,0.4)] flex flex-col items-center justify-center border-2 border-white/20 active:scale-90 transition-all duration-300">
                    <span className="text-2xl mb-0.5">🚨</span>
                    <span className="text-[9px] font-black text-white tracking-tighter leading-none">SOS</span>
                </div>

                {/* Floating Tooltip (Optional visual cue) */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A1A2E] text-white text-[8px] font-bold px-2 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    EMERGENCY HELP
                </div>
            </Link>

            <BottomNav />

            {/* Login Prompt Modal */}
            <LoginPromptModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
            />

            {/* LocationPicker — change location from header pill */}
            <LocationPicker
                isOpen={isLocationOpen}
                onClose={() => setIsLocationOpen(false)}
                initialLocation={location}
                initialPosition={position}
                onSelect={handleLocationSelect}
            />
        </div>
    )
}
