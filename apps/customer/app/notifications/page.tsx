'use client'
import { useState, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/data'
import { useAuth } from '@/lib/AuthContext'

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (authLoading) return
        if (!user) { setLoading(false); return }

        const fetchNotifs = async () => {
            const { data } = await supabase
                .from('bookings')
                .select('*, shops(name)')
                .eq('user_id', user.uid)
                .order('date', { ascending: false })

            const generated: any[] = []

            if (data) {
                data.forEach((b: any) => {
                    const shopName = b.shops?.name || 'the shop'
                    if (b.status === 'accepted') {
                        generated.push({ id: b.id + 'a', icon: '✅', title: 'Booking Accepted!', body: `${shopName} has accepted your booking.`, time: b.date, read: false })
                    } else if (b.status === 'on-the-way') {
                        generated.push({ id: b.id + 'o', icon: '🚗', title: 'Technician On the Way', body: `Your technician from ${shopName} is on the way.`, time: b.date, read: false })
                    } else if (b.status === 'in-progress') {
                        generated.push({ id: b.id + 'p', icon: '🔧', title: 'Work In Progress', body: `Technician from ${shopName} has started the work.`, time: b.date, read: false })
                    } else if (b.status === 'completed') {
                        generated.push({ id: b.id + 'c', icon: '🎉', title: 'Service Completed!', body: `Your service by ${shopName} is done. Thank you for choosing QuickFix!`, time: b.date, read: true })
                    } else if (b.status === 'requested') {
                        generated.push({ id: b.id + 'r', icon: '📋', title: 'Booking Requested', body: `Your booking request was sent to ${shopName}. Waiting for confirmation.`, time: b.date, read: true })
                    } else if (b.status === 'cancelled') {
                        generated.push({ id: b.id + 'x', icon: '❌', title: 'Booking Cancelled', body: `Your booking with ${shopName} was cancelled.`, time: b.date, read: true })
                    }
                })
            }

            setNotifications(generated)
            setLoading(false)
        }
        fetchNotifs()

        // Realtime: update notifications when booking status changes
        const channel = supabase
            .channel(`notifs_${user.uid}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.uid}` },
                () => { fetchNotifs() }
            )
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.uid}` },
                () => { fetchNotifs() }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [user, authLoading])

    const unread = notifications.filter(n => !n.read).length
    const todayNotifs = notifications.filter(n => !n.read)
    const earlierNotifs = notifications.filter(n => n.read)

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="px-5 pt-12 pb-4 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h1 className="font-black text-[#1A1A2E] text-2xl">Notifications</h1>
                    {unread > 0 && (
                        <span className="bg-[#FF6B35] text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread} new</span>
                    )}
                </div>
            </div>

            <div className="px-5 pt-4">
                {loading || authLoading ? (
                    <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div></div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="text-6xl">🔔</span>
                        <p className="text-gray-600 font-bold mt-4">No notifications yet</p>
                        <p className="text-gray-400 text-sm mt-1">Your booking updates will appear here.</p>
                    </div>
                ) : (
                    <>
                        {todayNotifs.length > 0 && (
                            <>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Latest</p>
                                <div className="flex flex-col gap-2 mb-5">
                                    {todayNotifs.map(notif => (
                                        <div key={notif.id} className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3 animate-slide-up">
                                            <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                                                {notif.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-[#1A1A2E] text-sm">{notif.title}</p>
                                                    <span className="w-2 h-2 bg-[#FF6B35] rounded-full shrink-0" />
                                                </div>
                                                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{notif.body}</p>
                                                <p className="text-gray-400 text-[11px] mt-1.5">{notif.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {earlierNotifs.length > 0 && (
                            <>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Earlier</p>
                                <div className="flex flex-col gap-2">
                                    {earlierNotifs.map(notif => (
                                        <div key={notif.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                                                {notif.icon}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-[#1A1A2E] text-sm">{notif.title}</p>
                                                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{notif.body}</p>
                                                <p className="text-gray-400 text-[11px] mt-1.5">{notif.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
