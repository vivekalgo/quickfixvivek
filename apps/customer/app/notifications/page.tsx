'use client'
import { useState, useEffect, useRef } from 'react'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/data'
import { useAuth } from '@/lib/AuthContext'

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [swipingId, setSwipingId] = useState<string | null>(null)
    const [swipeOffset, setSwipeOffset] = useState(0)
    const touchStart = useRef(0)

    const fetchNotifs = async () => {
        if (!user) { setLoading(false); return }
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.uid)
            .order('created_at', { ascending: false })
        
        if (data) setNotifications(data)
        setLoading(false)
        
        // Mark all as read when opening page
        if (data && data.some(n => !n.is_read)) {
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.uid)
        }
    }

    useEffect(() => {
        if (authLoading) return
        fetchNotifs()

        const channel = supabase.channel('realtime-notifs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.uid}` }, () => fetchNotifs())
            .subscribe()
        
        return () => { supabase.removeChannel(channel) }
    }, [user, authLoading])

    const handleDelete = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
        await supabase.from('notifications').delete().eq('id', id)
    }

    // Swipe Handlers
    const onTouchStart = (e: React.TouchEvent, id: string) => {
        touchStart.current = e.targetTouches[0].clientX
        setSwipingId(id)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        const currentX = e.targetTouches[0].clientX
        const diff = currentX - touchStart.current
        if (diff < 0) { // Only swipe left
            setSwipeOffset(Math.max(diff, -100))
        }
    }

    const onTouchEnd = (id: string) => {
        if (swipeOffset < -60) {
            handleDelete(id)
        }
        setSwipeOffset(0)
        setSwipingId(null)
    }

    return (
        <div className="pb-24 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="px-5 pt-12 pb-6 bg-white border-b border-gray-100 rounded-b-[40px] shadow-sm">
                <h1 className="font-black text-[#1A1A2E] text-2xl">Notifications</h1>
                <p className="text-gray-400 text-xs mt-1 font-medium">Slide left to remove an alert</p>
            </div>

            <div className="px-5 pt-6">
                {loading || authLoading ? (
                    <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div></div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm mt-4">
                        <span className="text-6xl block mb-4">🔔</span>
                        <p className="text-[#1A1A2E] font-black text-lg">All caught up!</p>
                        <p className="text-gray-400 text-sm mt-1 px-10">No new alerts or messages at the moment.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {notifications.map(notif => (
                            <div key={notif.id} className="relative group overflow-hidden rounded-3xl">
                                {/* Delete Action Background */}
                                <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-8 text-white font-black text-xs">
                                    REMOVE
                                </div>
                                
                                {/* Notification Card */}
                                <div 
                                    onTouchStart={(e) => onTouchStart(e, notif.id)}
                                    onTouchMove={onTouchMove}
                                    onTouchEnd={() => onTouchEnd(notif.id)}
                                    style={{ 
                                        transform: swipingId === notif.id ? `translateX(${swipeOffset}px)` : 'none',
                                        transition: swipingId === notif.id ? 'none' : 'transform 0.3s ease'
                                    }}
                                    className={`bg-white p-5 flex gap-4 border border-gray-100 shadow-sm relative z-10 transition-transform active:scale-[0.98] ${notif.is_read ? 'opacity-80' : ''}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${notif.type === 'info' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                        {notif.type === 'info' ? '📢' : '🔔'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-black text-[#1A1A2E] text-sm truncate">{notif.title}</p>
                                            {!notif.is_read && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 animate-pulse" />}
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-2">{notif.message}</p>
                                        <p className="text-gray-400 text-[10px] mt-2 font-bold uppercase tracking-wider">
                                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
