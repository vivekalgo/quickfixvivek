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

    const handleClearAll = async () => {
        if (!user || notifications.length === 0) return
        if (confirm('Are you sure you want to clear all notifications?')) {
            setNotifications([])
            await supabase.from('notifications').delete().eq('user_id', user.uid)
        }
    }

    return (
        <div className="pb-24 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="px-5 pt-12 pb-8 bg-white border-b border-gray-100 rounded-b-[40px] shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-black text-[#1A1A2E] text-3xl tracking-tight">Alerts</h1>
                        <p className="text-gray-400 text-xs mt-1 font-bold uppercase tracking-widest">Recent Updates</p>
                    </div>
                    {notifications.length > 0 && (
                        <button 
                            onClick={handleClearAll}
                            className="bg-red-50 text-red-500 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-transform"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            <div className="px-5 pt-6">
                {loading || authLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-xs font-bold mt-4 uppercase tracking-widest">Loading Alerts...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[40px] border border-gray-100 shadow-sm mt-4 px-10">
                        <div className="w-20 h-20 bg-gray-50 rounded-[30px] flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🔔</span>
                        </div>
                        <h3 className="text-[#1A1A2E] font-black text-xl">All caught up!</h3>
                        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                            No new alerts or messages at the moment. We'll notify you here when your service status changes.
                        </p>
                        <button 
                            onClick={() => window.location.href = '/'}
                            className="mt-8 bg-[#1A1A2E] text-white px-8 py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform"
                        >
                            Back Home
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {notifications.map(notif => (
                            <div key={notif.id} className="relative group overflow-hidden rounded-[32px] shadow-sm shadow-gray-200/20">
                                {/* Delete Action Background */}
                                <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-8 text-white font-black text-[10px] tracking-widest">
                                    REMOVE
                                </div>
                                
                                {/* Notification Card */}
                                <div 
                                    onTouchStart={(e) => onTouchStart(e, notif.id)}
                                    onTouchMove={onTouchMove}
                                    onTouchEnd={() => onTouchEnd(notif.id)}
                                    style={{ 
                                        transform: swipingId === notif.id ? `translateX(${swipeOffset}px)` : 'none',
                                        transition: swipingId === notif.id ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
                                    }}
                                    className={`bg-white p-5 flex gap-4 border border-gray-100 relative z-10 active:bg-gray-50/80 transition-colors ${notif.is_read ? 'opacity-80' : ''}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                                        notif.type === 'info' ? 'bg-blue-50' : 
                                        notif.type === 'success' ? 'bg-emerald-50' :
                                        notif.type === 'warning' ? 'bg-amber-50' : 'bg-orange-50'
                                    }`}>
                                        {notif.type === 'info' ? '📢' : 
                                         notif.type === 'success' ? '✅' :
                                         notif.type === 'warning' ? '⚠️' : '🔔'}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-black text-[#1A1A2E] text-base truncate leading-tight">{notif.title}</p>
                                            {!notif.is_read && <span className="w-2.5 h-2.5 bg-[#FF6B35] rounded-full shrink-0 animate-pulse mt-1.5" />}
                                        </div>
                                        <p className="text-gray-500 text-sm mt-0.5 leading-relaxed line-clamp-2 font-medium">{notif.message}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-gray-300 text-[10px]">•</span>
                                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">
                                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {' • '}
                                                {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
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
