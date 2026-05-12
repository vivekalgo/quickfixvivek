'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/data'
import { useRouter } from 'next/navigation'
import { NotificationService } from '@/services/notifications'
import NotificationListener from '@/components/NotificationListener'
import PushNotificationManager from '@/components/PushNotificationManager'

type View = 'dashboard' | 'services' | 'orders' | 'earnings' | 'profile'

const NAV = [
    { id: 'dashboard' as View, icon: '📊', label: 'Dashboard' },
    { id: 'orders' as View, icon: '📋', label: 'Incoming Orders' },
    { id: 'services' as View, icon: '🔧', label: 'Manage Services' },
    { id: 'earnings' as View, icon: '💰', label: 'Earnings' },
    { id: 'profile' as View, icon: '🏪', label: 'Shop Profile' },
]

function DashboardView({ shop, shopBookings }: any) {
    const stats = [
        { label: 'Total Orders', value: shopBookings.length, icon: '📋', color: '#6366F1', bg: '#EEF2FF' },
        { label: 'Completed', value: shopBookings.filter((b:any) => b.status === 'completed').length, icon: '✅', color: '#059669', bg: '#D1FAE5' },
        { label: 'Pending', value: shopBookings.filter((b:any) => b.status === 'requested').length, icon: '⏳', color: '#D97706', bg: '#FEF3C7' },
        { label: 'Earnings', value: `₹${shopBookings.filter((b:any) => b.status === 'completed').reduce((s:any, b:any) => s + Number(b.service_price), 0)}`, icon: '💰', color: '#FF6B35', bg: '#FFF3EE' },
    ]
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Welcome back, {shop.owner_name || 'Owner'}! 👋</h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: s.bg }}>
                            {s.icon}
                        </div>
                        <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-gray-500 text-sm mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-r from-[#1A1A2E] to-[#0F3460] rounded-2xl p-6 mb-6 flex items-center gap-5">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                    <Image
                        src={shop.images?.[0] || 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800'}
                        alt={shop.name}
                        fill
                        sizes="64px"
                        unoptimized
                        className="object-cover"
                    />
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-black text-lg">{shop.name}</h3>
                    <p className="text-white/60 text-sm">{shop.address}</p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-amber-400 font-bold text-sm">★ {shop.rating}</span>
                        <span className="text-white/40">•</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${shop.is_open ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {shop.is_open ? '● Open' : '● Closed'}
                        </span>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-white/40 text-xs">Total Reviews</p>
                    <p className="text-white font-black text-2xl">{shop.total_reviews}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-[#1A1A2E]">Recent Orders</h3>
                    <span className="text-xs text-gray-400">{shopBookings.length} total</span>
                </div>
                {shopBookings.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No orders yet</div>
                ) : (
                    shopBookings.slice(0, 5).map((b:any, i:number) => (
                        <div key={b.id} className={`px-5 py-4 flex items-center gap-3 ${i < Math.min(shopBookings.length, 5) - 1 ? 'border-b border-gray-50' : ''}`}>
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center font-bold text-[#FF6B35] text-sm shrink-0">
                                #{i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-[#1A1A2E] truncate">{b.users?.name || 'Customer'}</p>
                                <p className="text-gray-400 text-xs">{b.services?.name || 'Service'} • {b.date}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="font-bold text-[#FF6B35]">₹{b.service_price}</p>
                                <span className={`text-[11px] inline-block mt-1 font-semibold px-2 py-0.5 rounded-full ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        b.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                    }`}>{b.status}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

function ServicesView({ shop }: any) {
    const [services, setServices] = useState(shop.services || [])
    const [showAdd, setShowAdd] = useState(false)
    const [form, setForm] = useState({ name: '', description: '', price: '', duration: '' })

    const handleAdd = async () => {
        if (!form.name || !form.price) return
        const newSv = {
            id: `sv${Date.now()}`,
            shop_id: shop.id,
            name: form.name,
            description: form.description,
            price: Number(form.price),
            duration: form.duration,
            category: shop.category?.[0] || 'other'
        }
        await supabase.from('services').insert(newSv)
        setServices((prev:any) => [...prev, newSv])
        setForm({ name: '', description: '', price: '', duration: '' })
        setShowAdd(false)
    }

    const deleteService = async (id: string) => {
        await supabase.from('services').delete().eq('id', id)
        setServices((prev:any) => prev.filter((s:any) => s.id !== id))
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-[#1A1A2E]">Manage Services</h2>
                <button onClick={() => setShowAdd(true)} className="bg-[#FF6B35] text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2">
                    + Add Service
                </button>
            </div>

            {showAdd && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5">
                    <h3 className="font-bold text-[#1A1A2E] mb-4">Add New Service</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Service name *" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] col-span-2" />
                        <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Price (₹) *" type="number" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35]" />
                        <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="Duration (e.g. 1 hour)" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35]" />
                        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] col-span-2" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="flex-1 bg-[#FF6B35] text-white py-2.5 rounded-xl font-bold text-sm">Add Service</button>
                        <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm">Cancel</button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {services.map((sv:any) => (
                    <div key={sv.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                        <div className="flex-1">
                            <p className="font-bold text-[#1A1A2E]">{sv.name}</p>
                            <p className="text-gray-400 text-sm mt-0.5">{sv.description}</p>
                            <p className="text-gray-400 text-xs mt-1">⏱ {sv.duration}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="font-black text-[#FF6B35] text-xl">₹{sv.price}</p>
                            <div className="flex gap-2 mt-2">
                                <button className="text-xs border border-gray-200 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-50">Edit</button>
                                <button onClick={() => deleteService(sv.id)}
                                    className="text-xs border border-red-200 px-3 py-1 rounded-lg text-red-500 hover:bg-red-50">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function OrdersView({ shopBookings, refresh }: any) {
    const [orders, setOrders] = useState(shopBookings)
    
    useEffect(() => {
        setOrders(shopBookings)
    }, [shopBookings])

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('bookings').update({ status }).eq('id', id)
        setOrders((prev:any) => prev.map((o:any) => o.id === id ? { ...o, status } : o))
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-[#1A1A2E]">Incoming Orders</h2>
                <button onClick={refresh} className="bg-gray-100 text-[#1A1A2E] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 active:scale-95 transition-transform">
                    🔄 Refresh
                </button>
            </div>
            {orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                    <span className="text-6xl">📋</span>
                    <p className="text-gray-600 font-bold mt-4">No orders yet</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {orders.map((order:any) => (
                        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-[#1A1A2E]">{order.users?.name || 'Customer'}</p>
                                    <p className="text-gray-400 text-sm">{order.services?.name || 'Service'}</p>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'on-the-way' ? 'bg-purple-100 text-purple-700' :
                                                'bg-amber-100 text-amber-700'
                                    }`}>{order.status}</span>
                            </div>
                            <div className="px-5 py-3">
                                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                                    <div><p className="text-gray-400 text-xs">Date</p><p className="font-semibold">{order.date}</p></div>
                                    <div><p className="text-gray-400 text-xs">Time</p><p className="font-semibold">{order.time}</p></div>
                                    <div><p className="text-gray-400 text-xs">Amount</p><p className="font-bold text-[#FF6B35]">₹{order.service_price}</p></div>
                                </div>
                                
                                {['accepted', 'on-the-way', 'completed'].includes(order.status) ? (
                                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl mb-2">
                                         <p className="text-[#1A1A2E] text-sm mb-1 font-bold">📞 {order.users?.phone || 'No phone provided'}</p>
                                         <p className="text-gray-600 text-xs mb-1">📍 {order.address}</p>
                                         {order.latitude && order.longitude && (
                                             <a 
                                                 href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`} 
                                                 target="_blank" 
                                                 rel="noopener noreferrer"
                                                 className="mt-2 inline-flex items-center gap-1.5 text-[#FF6B35] text-[11px] font-bold bg-white px-3 py-1.5 rounded-lg border border-orange-100 shadow-sm active:scale-95 transition-transform"
                                             >
                                                 🗺️ View Exact Location on Map
                                             </a>
                                         )}
                                         {order.description && <p className="text-gray-500 text-xs mt-2 pt-2 border-t border-orange-100/50">💬 {order.description}</p>}
                                     </div>
                                ) : (
                                    <div className="bg-gray-50 border border-dashed border-gray-200 p-3 rounded-xl text-center mb-2">
                                        <p className="text-gray-500 text-xs font-bold w-full truncate px-4">📍 {order.address.split(',').slice(-2).join(', ') || 'Local Area'}</p>
                                        <p className="text-gray-400 text-[10px] mt-1">Accept the order to view exact location & phone number</p>
                                    </div>
                                )}

                                {order.status === 'requested' && (
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => updateStatus(order.id, 'accepted')} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm">✅ Accept</button>
                                        <button onClick={() => updateStatus(order.id, 'cancelled')} className="flex-1 bg-red-50 border border-red-200 text-red-600 py-2.5 rounded-xl font-bold text-sm">❌ Decline</button>
                                    </div>
                                )}
                                {order.status === 'accepted' && (
                                    <button onClick={() => updateStatus(order.id, 'on-the-way')} className="w-full mt-4 bg-purple-500 text-white py-2.5 rounded-xl font-bold text-sm">🚗 Mark On the Way</button>
                                )}
                                {order.status === 'on-the-way' && (
                                    <button onClick={() => updateStatus(order.id, 'completed')} className="w-full mt-4 bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm">✅ Mark Completed</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function EarningsView({ shopBookings }: any) {
    const completed = shopBookings.filter((b:any) => b.status === 'completed')
    const totalEarnings = completed.reduce((s:any, b:any) => s + Number(b.service_price), 0)
    
    // Group completed orders by day of week for the chart
    const getDayName = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('en-US', { weekday: 'short' })
        } catch { return 'Sun' }
    }
    
    const weeklyMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
    completed.forEach((b:any) => {
        const day = getDayName(b.date)
        if (weeklyMap[day] !== undefined) {
            weeklyMap[day] += Number(b.service_price) || 0
        }
    })
    
    const WEEKLY = Object.keys(weeklyMap).map(day => ({ day, amount: weeklyMap[day] }))
    const maxAmount = Math.max(...WEEKLY.map(w => w.amount), 100) // Ensure max is at least 100 to avoid div by 0

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Earnings</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Today', value: `₹${totalEarnings}`, icon: '📅', color: '#6366F1' },
                    { label: 'This Week', value: `₹${totalEarnings}`, icon: '📆', color: '#FF6B35' },
                    { label: 'This Month', value: `₹${totalEarnings}`, icon: '💰', color: '#059669' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                        <span className="text-2xl">{s.icon}</span>
                        <p className="font-black text-lg mt-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
                <h3 className="font-bold text-[#1A1A2E] mb-4">Weekly Earnings</h3>
                <div className="flex items-end gap-2 h-36">
                    {WEEKLY.map(w => (
                        <div key={w.day} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full bg-orange-100 rounded-t-lg transition-all hover:bg-[#FF6B35]/30 cursor-pointer relative group"
                                style={{ height: `${(w.amount / maxAmount) * 100}%` }}>
                                <div className="w-full h-full bg-gradient-to-t from-[#FF6B35] to-orange-300 rounded-t-lg opacity-80" />
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1A1A2E] text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    ₹{w.amount}
                                </div>
                            </div>
                            <span className="text-[11px] text-gray-500 font-medium">{w.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-[#1A1A2E]">Transaction History</h3>
                </div>
                {completed.map((b:any, i:number) => (
                    <div key={b.id} className={`px-5 py-4 flex items-center gap-3 ${i < completed.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                            ✅
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm text-[#1A1A2E]">{b.services?.name} — {b.users?.name}</p>
                            <p className="text-gray-400 text-xs">{b.date} • {b.payment_method}</p>
                        </div>
                        <p className="font-black text-emerald-600">+₹{b.service_price}</p>
                    </div>
                ))}
                {completed.length === 0 && (
                    <div className="p-8 text-center text-gray-400">No completed orders yet</div>
                )}
            </div>
        </div>
    )
}

function ShopProfileView({ shop, setShop }: any) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        phone: shop.phone || '',
        city: shop.city || '',
        price_range: shop.price_range || '',
        open_time: shop.open_time || '',
        close_time: shop.close_time || '',
        address: shop.address || '',
        name: shop.name || '',
        images: shop.images || []
    })

    const handleSave = async () => {
        setLoading(true)
        const updates = { ...shop, ...form }
        // Save to Supabase
        const { error } = await supabase.from('shops').update({
            phone: form.phone,
            city: form.city,
            price_range: form.price_range,
            open_time: form.open_time,
            close_time: form.close_time,
            address: form.address,
            name: form.name,
            images: form.images
        }).eq('id', shop.id)
        if (!error) {
            setShop(updates)
            setIsEditing(false)
        }
        setLoading(false)
    }

    if (isEditing) {
        return (
            <div className="animate-fade-in bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-[#1A1A2E]">Edit Shop Profile</h2>
                    <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
                
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Shop Name</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Address</label>
                        <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">City</label>
                            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Phone Number</label>
                            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Open Time (e.g. 09:00 AM)</label>
                            <input value={form.open_time} onChange={e => setForm(f => ({ ...f, open_time: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Close Time (e.g. 08:00 PM)</label>
                            <input value={form.close_time} onChange={e => setForm(f => ({ ...f, close_time: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Shop Image URL</label>
                        <input 
                            value={form.images[0] || ''} 
                            onChange={e => setForm(f => ({ ...f, images: [e.target.value] }))} 
                            placeholder="Paste high-quality image URL here..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" 
                        />
                        <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Tip: Use a clear photo of your shop front for better trust.</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Price Range (e.g. ₹100 - ₹500)</label>
                        <input value={form.price_range} onChange={e => setForm(f => ({ ...f, price_range: e.target.value }))} placeholder="e.g. ₹100 - ₹500" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                    </div>

                    <button disabled={loading} onClick={handleSave} className="w-full bg-[#FF6B35] text-white py-4 mt-2 rounded-2xl font-bold disabled:opacity-70 transition-transform active:scale-95 shadow-lg shadow-orange-500/20">
                        {loading ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Shop Profile</h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4 shadow-sm">
                <div className="h-40 bg-gradient-to-r from-[#FF6B35] to-[#E85A24] relative">
                    <Image
                        src={shop.images?.[0] || 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800'}
                        alt={shop.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        unoptimized
                        className="object-cover opacity-40 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 flex items-end p-5 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                        <div>
                            <h3 className="text-white font-black text-xl">{shop.name}</h3>
                            <p className="text-white/90 text-sm font-medium">{shop.address}</p>
                        </div>
                        <div className="ml-auto bg-white/20 backdrop-blur-md border border-white/20 px-3 py-2 rounded-xl text-center shadow-lg">
                            <p className="text-white font-black text-lg">★ {shop.rating}</p>
                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{shop.total_reviews} reviews</p>
                        </div>
                    </div>
                </div>
                <div className="p-5">
                    {[
                        { label: 'Phone', value: shop.phone },
                        { label: 'City', value: shop.city },
                        { label: 'Hours', value: `${shop.open_time} to ${shop.close_time}` },
                        { label: 'Price Range', value: shop.price_range },
                        { label: 'Categories', value: shop.category?.map((c:any) => c.replace(/-/g, ' ')).join(', ') },
                    ].map(row => (
                        <div key={row.label} className="flex justify-between py-3.5 border-b border-gray-50 last:border-0">
                            <span className="text-gray-400 text-sm font-medium">{row.label}</span>
                            <span className="text-[#1A1A2E] font-bold text-sm capitalize text-right">{row.value}</span>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={() => setIsEditing(true)} className="w-full bg-white border border-gray-200 text-[#1A1A2E] py-4 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-colors active:scale-[0.98]">
                Edit Shop Details
            </button>
        </div>
    )
}

// ── Provider Auth View ─────────────────────────────────────────────────────────

function ProviderAuth({ onLogin }: { onLogin: (shop: any) => void }) {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone || !password) return
        setLoading(true)
        setError('')
        
        // Find user by phone and password
        const { data: user } = await supabase.from('users')
            .select('*')
            .eq('phone', phone)
            .eq('password', password)
            .single()
            
        if (!user) {
            setError('Invalid phone number or password.')
            setLoading(false)
            return
        }
        
        // Find shop owned by user
        const { data: shop } = await supabase.from('shops').select('*, services(*)').eq('owner_id', user.id).single()
        if (!shop) {
            setError('No authorized shop found for this provider.')
            setLoading(false)
            return
        }
        
        onLogin(shop)
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#E85A24] flex items-center justify-center text-3xl">⚡</div>
                </div>
                <h1 className="text-2xl font-black text-center text-[#1A1A2E] mb-2">QuickFix Provider</h1>
                <p className="text-center text-gray-400 text-sm font-semibold mb-8">
                    Login to your shop dashboard
                </p>

                {error && <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl mb-4 text-center border border-red-100">{error}</div>}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input type="text" required placeholder="Phone Number (e.g. +919000000001)" value={phone} onChange={e => setPhone(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-[#1A1A2E]" />
                        
                    <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-[#1A1A2E]" />

                    <button disabled={loading} type="submit" className="w-full bg-[#1A1A2E] text-white py-4 rounded-xl font-black text-lg mt-2 transition-transform active:scale-95 disabled:opacity-70">
                        {loading ? 'Please wait...' : 'Secure Login'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                    <p className="text-xs text-gray-400 font-medium">
                        If you haven&apos;t received your credentials yet, please contact the QuickFix platform administrator to register your shop.
                    </p>
                </div>
            </div>
        </div>
    )
}

// ── Main Provider Dashboard ─────────────────────────────────────────────────

export default function ProviderDashboard() {
    const router = useRouter()
    const [activeView, setActiveView] = useState<View>('dashboard')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [shop, setShop] = useState<any>(null)
    const [shopBookings, setShopBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    const checkAuth = async () => {
        let savedShopId = typeof window !== 'undefined' ? localStorage.getItem('providerShopId') : null
        
        // If no shop logged in, try to auto-login with the first shop in DB
        if (!savedShopId) {
            const { data: firstShop } = await supabase.from('shops').select('id').limit(1).single()
            if (firstShop) {
                savedShopId = firstShop.id
                localStorage.setItem('providerShopId', savedShopId)
            }
        }

        if (savedShopId) {
            const { data: s, error: sError } = await supabase.from('shops').select('*, services(*)').eq('id', savedShopId).single()
            if (sError) {
                console.error('Shop Fetch Error:', sError)
                if (sError.code === 'PGRST116') localStorage.removeItem('providerShopId')
            }
            
            if (s) {
                setShop(s)
                const { data: b, error: bError } = await supabase.from('bookings').select('*, users(name, phone), services(name)').eq('shop_id', s.id)
                if (bError) console.error('Bookings Fetch Error:', bError)
                if (b) setShopBookings(b)
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        setMounted(true)
        checkAuth()
    }, [])

    const handleLogin = async (loggedShop: any) => {
        setShop(loggedShop)
        localStorage.setItem('providerShopId', loggedShop.id)
        const { data: b } = await supabase.from('bookings').select('*, users(name, phone), services(name)').eq('shop_id', loggedShop.id)
        if (b) setShopBookings(b)
    }

    // Realtime Sync for All Bookings (Normal + Emergency)
    useEffect(() => {
        if (!shop?.id) return

        // 1. Normal Bookings Listener
        const normalChannel = supabase
            .channel(`shop_${shop.id}_normal_bookings`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `shop_id=eq.${shop.id}`
                },
                async (payload) => {
                    console.log('Normal Booking update:', payload)
                    if (payload.eventType === 'INSERT') {
                        const { data: newBooking } = await supabase
                            .from('bookings')
                            .select('*, users(name, phone), services(name)')
                            .eq('id', payload.new.id)
                            .single()
                        if (newBooking) setShopBookings(prev => [newBooking, ...prev])
                    } else if (payload.eventType === 'UPDATE') {
                        setShopBookings(prev => prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b))
                    } else if (payload.eventType === 'DELETE') {
                        setShopBookings(prev => prev.filter(b => b.id === payload.old.id))
                    }
                }
            )
            .subscribe()

        // 2. Emergency Bookings Listener (Global or filtered by status)
        const emergencyChannel = supabase
            .channel('emergency_bookings_sync')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'emergency_bookings'
                },
                async (payload) => {
                    console.log('New Emergency Booking:', payload)
                    // You might want to refresh the dashboard or show a special alert
                    // For now, we'll let the NotificationListener handle the alert
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(normalChannel)
            supabase.removeChannel(emergencyChannel)
        }
    }, [shop?.id])

    if (!mounted) return null // Prevent SSR/Build crashes

    const handleLogout = () => {
        localStorage.removeItem('providerShopId')
        setShop(null)
    }

    if (loading) return <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center text-[#1A1A2E] font-bold">Verifying Session...</div>
    
    if (!shop) return <ProviderAuth onLogin={handleLogin} />

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView shop={shop} shopBookings={shopBookings} />
            case 'services': return <ServicesView shop={shop} />
            case 'orders': return <OrdersView shopBookings={shopBookings} refresh={() => checkAuth()} />
            case 'earnings': return <EarningsView shopBookings={shopBookings} />
            case 'profile': return <ShopProfileView shop={shop} setShop={setShop} />
        }
    }

    useEffect(() => {
        if (shop?.owner_id) {
            NotificationService.initialize(shop.owner_id, 'provider', router)
        }
    }, [shop?.owner_id, router])

    return (
        <div className="min-h-screen flex bg-[#F4F6F9]">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1A2E] transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="px-6 py-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#E85A24] flex items-center justify-center text-xl">⚡</div>
                        <div>
                            <p className="text-white font-black text-lg leading-none">QuickFix</p>
                            <p className="text-white/40 text-xs">Provider Portal</p>
                        </div>
                    </div>
                </div>

                {/* Shop chip */}
                <div className="mx-4 my-4 bg-white/5 rounded-xl p-3 flex items-center gap-2">
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
                        <Image
                            src={shop.images?.[0] || 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800'}
                            alt={shop.name}
                            fill
                            sizes="36px"
                            unoptimized
                            className="object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate">{shop.name}</p>
                        <span className={`text-[10px] font-semibold ${shop.is_open ? 'text-emerald-400' : 'text-gray-400'}`}>
                            {shop.is_open ? '● Open' : '● Closed'}
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="px-3 flex flex-col gap-1">
                    {NAV.map(item => (
                        <button key={item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false) }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${activeView === item.id ? 'bg-[#FF6B35] text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
                
                <div className="absolute bottom-6 left-0 right-0 px-4">
                    <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 bg-red-500/10 text-red-500 py-3 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors">
                        Logout
                    </button>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg width="18" height="18" fill="none" stroke="#1A1A2E" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="font-black text-[#1A1A2E] text-lg capitalize">{activeView.replace('-', ' ')}</h1>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        <div className="text-right hidden sm:block">
                            <p className="text-[#1A1A2E] font-bold text-xs">Logged in as</p>
                            <p className="text-[#FF6B35] font-black text-sm">{shop.phone}</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    )
}
