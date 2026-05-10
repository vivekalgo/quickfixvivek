'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Shop } from '@/lib/data'
import { useAuth } from '@/lib/AuthContext'
import LoginPromptModal from './LoginPromptModal'
import { isShopOpen } from '@/lib/timeUtils'

interface ShopCardProps {
    shop: Shop
}

export default function ShopCard({ shop }: ShopCardProps) {
    const { user } = useAuth()
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)

    const isOpen = isShopOpen(shop.openTime, shop.closeTime)

    const mainCategory = shop.category[0]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const minPrice = Math.min(...shop.services.map(s => s.price))

    const detailHref = `/shops/detail?id=${shop.id}`

    // If user is logged in → normal Link; if not → show login modal on click
    const handleClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault()
            setShowLoginPrompt(true)
        }
    }

    return (
        <>
            <Link href={detailHref} className="block" onClick={handleClick}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98] transition-transform">
                    {/* Image */}
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                        <Image
                            src={shop.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'}
                            alt={shop.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            unoptimized
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${isOpen ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}>
                                {isOpen ? '● Open Now' : '● Closed'}
                            </span>
                        </div>
                        {shop.distance != null && (
                            <div className="absolute top-3 right-3 animate-fade-in shadow-lg">
                                <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[11px] font-black text-[#1A1A2E] flex items-center gap-1 border border-white/50">
                                    <span className="text-[#FF6B35]">📍</span> {shop.distance} km
                                </span>
                            </div>
                        )}

                        {/* "Login to Book" overlay hint for guests */}
                        {!user && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 flex items-center justify-between">
                                <span className="text-white/90 text-[11px] font-semibold">Tap to book</span>
                                <span className="bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    🔐 Login Required
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <div className="flex items-start justify-between mb-1">
                            <div>
                                <h3 className="font-bold text-[#1A1A2E] text-base leading-tight">{shop.name}</h3>
                                <p className="text-gray-500 text-xs mt-0.5">{mainCategory} • {shop.address.slice(0, 30)}...</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0 ml-2">
                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                                    <span className="text-amber-500 text-xs">★</span>
                                    <span className="text-amber-700 font-bold text-sm">{shop.rating}</span>
                                </div>
                                <span className="text-gray-400 text-[10px] mt-0.5">({shop.totalReviews})</span>
                            </div>
                        </div>

                        {/* Services chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                            {shop.services.slice(0, 3).map(s => (
                                <span key={s.id} className="text-[11px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                                    {s.name}
                                </span>
                            ))}
                            {shop.services.length > 3 && (
                                <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                    +{shop.services.length - 3} more
                                </span>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <span className="text-[13px] font-semibold text-gray-700">
                                Starts at <span className="text-[#FF6B35]">₹{minPrice}</span>
                            </span>
                            <span className="text-[11px] text-gray-400">{shop.openTime} - {shop.closeTime}</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Login prompt modal — shown when guest tries to book */}
            <LoginPromptModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                redirectAfter={detailHref}
            />
        </>
    )
}
