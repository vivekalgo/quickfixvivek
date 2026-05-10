'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/data'

const MENU_ITEMS = [
    { icon: '📋', label: 'My Orders', href: '/orders' },
    { icon: '📍', label: 'Saved Addresses', href: '#' },
    { icon: '💳', label: 'Payment Methods', href: '#' },
    { icon: '🎁', label: 'Offers & Coupons', href: '#' },
    { icon: '⭐', label: 'My Reviews', href: '#' },
    { icon: '🔔', label: 'Notifications', href: '/notifications' },
    { icon: '❓', label: 'Help & Support', href: '#' },
    { icon: '📜', label: 'Terms & Privacy', href: '#' },
]

export default function ProfilePage() {
    const router = useRouter()
    const { user, signOut, updateProfile } = useAuth()
    const [stats, setStats] = useState({ total: 0, completed: 0, reviews: 0 })
    const [isEditing, setIsEditing] = useState(false)
    const [newName, setNewName] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const loadStats = async () => {
            if (!user) return
            
            // Fetch real stats from Supabase using the Auth UID
            const [bRes, cRes, rRes] = await Promise.all([
                supabase.from('bookings').select('id', { count: 'exact' }).eq('user_id', user.uid),
                supabase.from('bookings').select('id', { count: 'exact' }).eq('user_id', user.uid).eq('status', 'completed'),
                supabase.from('reviews').select('id', { count: 'exact' }).eq('user_id', user.uid)
            ])
            
            setStats({
                total: bRes.count || 0,
                completed: cRes.count || 0,
                reviews: rRes.count || 0
            })
        }
        loadStats()
    }, [user])

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    const handleSaveName = async () => {
        if (newName.trim().length < 2) return
        setSaving(true)
        try {
            await updateProfile({ name: newName })
            setIsEditing(false)
        } catch (err: any) {
            console.error('Failed to update name:', err)
            alert(err.message || 'Failed to update name. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const startEditing = () => {
        setNewName(user?.displayName || '')
        setIsEditing(true)
    }

    if (!user) return null

    return (
        <AuthGuard>
        <div className="pb-24">
            {/* Header gradient */}
            <div className="px-5 pt-12 pb-8" style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #0F3460 100%)' }}>
                <h1 className="text-white font-black text-2xl mb-6">My Profile</h1>
                {/* Avatar + info */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl"
                            style={{ background: 'linear-gradient(135deg, #FF6B35, #E85A24)' }}>
                            {(user?.displayName || 'U')[0]}
                        </div>
                        <button onClick={isEditing ? handleSaveName : startEditing} disabled={saving}
                            className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform">
                            {isEditing ? (
                                saving ? (
                                    <div className="w-3 h-3 border-2 border-[#FF6B35] border-t-transparent animate-spin rounded-full" />
                                ) : (
                                    <span className="text-xs font-bold text-[#FF6B35]">OK</span>
                                )
                            ) : (
                                <svg width="14" height="14" fill="none" stroke="#FF6B35" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="flex-1">
                        {isEditing ? (
                            <input
                                autoFocus
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white font-black text-xl w-full outline-none focus:border-[#FF6B35]"
                            />
                        ) : (
                            <h2 className="text-white font-black text-xl truncate">{user?.displayName || 'User'}</h2>
                        )}
                        <p className="text-white/60 text-sm">{user.phone}</p>
                        <span className="mt-1 inline-block bg-[#FF6B35]/30 text-orange-300 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize">
                            Customer
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mx-5 -mt-4 bg-white rounded-2xl shadow-md border border-gray-100 p-4 grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: 'Total Orders', value: stats.total.toString(), icon: '📋' },
                    { label: 'Completed', value: stats.completed.toString(), icon: '✅' },
                    { label: 'Reviews', value: stats.reviews.toString(), icon: '⭐' },
                ].map(stat => (
                    <div key={stat.label} className="text-center">
                        <p className="text-2xl font-black text-[#FF6B35]">{stat.value}</p>
                        <p className="text-gray-400 text-[11px] mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="px-5">
                {/* Menu */}
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-5">
                    {MENU_ITEMS.map((item, i) => (
                        <Link key={item.label} href={item.href}>
                            <div className={`flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors ${i < MENU_ITEMS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <span className="text-xl w-8 text-center">{item.icon}</span>
                                <span className="flex-1 text-sm font-medium text-[#1A1A2E]">{item.label}</span>
                                <svg width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Become a Provider CTA */}
                <div className="bg-gradient-to-r from-[#1A1A2E] to-[#0F3460] rounded-2xl p-5 mb-5 flex items-center gap-4">
                    <span className="text-4xl">🔧</span>
                    <div className="flex-1">
                        <p className="text-white font-bold text-sm">Own a repair shop?</p>
                        <p className="text-white/60 text-xs">List your services on QuickFix</p>
                    </div>
                    <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer">
                        <button className="bg-[#FF6B35] text-white text-xs font-bold px-3 py-2 rounded-xl">
                            Join Now
                        </button>
                    </a>
                </div>

                {/* Logout */}
                <button onClick={handleLogout}
                    className="w-full border-2 border-red-100 text-red-500 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                    🚪 Sign Out
                </button>
                <p className="text-center text-gray-300 text-xs mt-4 mb-2">QuickFix v1.0.0 • Made with ❤️ in India</p>
            </div>
            <BottomNav />
        </div>
        </AuthGuard>
    )
}
