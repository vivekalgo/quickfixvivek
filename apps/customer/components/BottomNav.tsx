'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/data'
import LoginPromptModal from './LoginPromptModal'

// Auth-protected nav routes (require login)
const AUTH_REQUIRED = ['/orders', '/notifications', '/profile']

const navItems = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/orders', label: 'Orders', icon: OrdersIcon },
    { href: '/notifications', label: 'Alerts', icon: BellIcon },
    { href: '/profile', label: 'Profile', icon: ProfileIcon },
]

function HomeIcon({ active }: { active: boolean }) {
    return (
        <svg width="22" height="22" fill={active ? '#FF6B35' : 'none'} stroke={active ? '#FF6B35' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
    )
}
function OrdersIcon({ active }: { active: boolean }) {
    return (
        <svg width="22" height="22" fill={active ? '#FF6B35' : 'none'} stroke={active ? '#FF6B35' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
    )
}
function BellIcon({ active }: { active: boolean }) {
    return (
        <svg width="22" height="22" fill={active ? '#FF6B35' : 'none'} stroke={active ? '#FF6B35' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    )
}
function ProfileIcon({ active }: { active: boolean }) {
    return (
        <svg width="22" height="22" fill={active ? '#FF6B35' : 'none'} stroke={active ? '#FF6B35' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    )
}

export default function BottomNav() {
    const pathname = usePathname()
    const { user } = useAuth()
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)
    const [pendingHref, setPendingHref] = useState('/')
    const [notifCount, setNotifCount] = useState(0)

    const fetchNotifCount = async () => {
        if (!user) return
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.uid)
            .eq('is_read', false)
        setNotifCount(count || 0)
    }

    useEffect(() => {
        fetchNotifCount()
        if (!user) return

        const channel = supabase.channel('nav-notif-count')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.uid}` }, () => {
                fetchNotifCount()
            })
            .subscribe()
        
        return () => { supabase.removeChannel(channel) }
    }, [user])

    const handleNavClick = (e: React.MouseEvent, href: string) => {
        if (!user && AUTH_REQUIRED.includes(href)) {
            e.preventDefault()
            setPendingHref(href)
            setShowLoginPrompt(true)
        }
    }

    return (
        <>
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 z-50 bottom-nav">
                <div className="flex items-center justify-around py-2 px-2">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={(e) => handleNavClick(e, href)}
                                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all relative"
                            >
                                <Icon active={isActive} />
                                {href === '/notifications' && notifCount > 0 && (
                                    <span className="absolute top-1 right-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                                        {notifCount > 9 ? '9+' : notifCount}
                                    </span>
                                )}
                                <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-[#FF6B35]' : 'text-gray-400'}`}>
                                    {label}
                                </span>
                                {isActive && (
                                    <span className="w-1 h-1 bg-[#FF6B35] rounded-full" />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>

            <LoginPromptModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                redirectAfter={pendingHref}
            />
        </>
    )
}
