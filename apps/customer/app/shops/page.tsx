'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import ShopCard from '@/components/ShopCard'
import { CATEGORIES, supabase } from '@/lib/data'

export default function ShopsPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [sort, setSort] = useState('distance')
    const [shops, setShops] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [position, setPosition] = useState<[number, number] | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPos = localStorage.getItem('qf_position')
            if (savedPos) setPosition(JSON.parse(savedPos))
        }

        const fetchShops = async () => {
            const { data } = await supabase.from('shops').select('*, services(*)')
            if (data) setShops(data)
            setLoading(false)
        }
        fetchShops()
    }, [])

    // Haversine distance formula
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Number((R * c).toFixed(1));
    }

    const filteredShops = shops.map(shop => {
        let distance = null;
        if (position && shop.latitude && shop.longitude) {
            distance = getDistance(position[0], position[1], shop.latitude, shop.longitude)
        }
        return { ...shop, distance }
    }).filter(shop => {
        const matchCat = activeCategory === 'all' || shop.category?.includes(activeCategory)
        const matchSearch = !search || shop.name.toLowerCase().includes(search.toLowerCase()) ||
            shop.services?.some((s:any) => s.name.toLowerCase().includes(search.toLowerCase()))
            
        // Only show approved shops and optionally within a reasonable radius (e.g. 50km) if position is set
        const matchRadius = shop.distance === null || shop.distance < 50
        return matchCat && matchSearch && shop.is_approved && matchRadius
    }).sort((a, b) => {
        if (sort === 'rating') return (b.rating || 0) - (a.rating || 0)
        // Check if there are services to compare min price, else fallback to 0
        if (sort === 'price') {
            const minA = a.services?.length ? Math.min(...a.services.map((s:any) => s.price)) : Infinity;
            const minB = b.services?.length ? Math.min(...b.services.map((s:any) => s.price)) : Infinity;
            return minA - minB;
        }
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        return 0;
    })

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="px-5 pt-12 pb-4 bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg width="18" height="18" fill="none" stroke="#1A1A2E" strokeWidth="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
                        <svg width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search shops or services..."
                            className="flex-1 bg-transparent text-gray-700 placeholder:text-gray-400 outline-none text-sm"
                        />
                    </div>
                </div>

                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button onClick={() => setActiveCategory('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-600'}`}>
                        All
                    </button>
                    {CATEGORIES.map(c => (
                        <button key={c.id} onClick={() => setActiveCategory(activeCategory === c.id ? 'all' : c.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === c.id ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                            style={activeCategory === c.id ? { background: c.color } : {}}>
                            {c.icon} {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-5 pt-4">
                {/* Sort + Count */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 text-sm font-medium">{filteredShops.length} shops found</span>
                    <div className="flex gap-2">
                        {[
                            { key: 'distance', label: '📍 Nearest' },
                            { key: 'rating', label: '⭐ Top Rated' },
                            { key: 'price', label: '💰 Cheapest' },
                        ].map(opt => (
                            <button key={opt.key} onClick={() => setSort(opt.key)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${sort === opt.key ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shop list */}
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredShops.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="text-6xl">🔍</span>
                        <p className="text-gray-600 font-bold mt-4">No shops found</p>
                        <p className="text-gray-400 text-sm mt-1">Try a different filter or search term</p>
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
            <BottomNav />
        </div>
    )
}
