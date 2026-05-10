'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/data'

type View = 'dashboard' | 'users' | 'shops' | 'orders' | 'analytics' | 'categories' | 'broadcast' | 'emergency' | 'banners'

const NAV = [
    { id: 'dashboard' as View, icon: '📊', label: 'Dashboard' },
    { id: 'emergency' as View, icon: '🚨', label: 'Emergency Support' },
    { id: 'users' as View, icon: '👥', label: 'Manage Users' },
    { id: 'shops' as View, icon: '🏪', label: 'Manage Shops' },
    { id: 'categories' as View, icon: '📂', label: 'Manage Categories' },
    { id: 'orders' as View, icon: '📋', label: 'Order Monitoring' },
    { id: 'broadcast' as View, icon: '📣', label: 'Broadcast' },
    { id: 'banners' as View, icon: '🖼️', label: 'Banner Manager' },
    { id: 'analytics' as View, icon: '📈', label: 'Analytics' },
]

function DashboardView({ users, shops, bookings }: any) {
    const totalRevenue = bookings.filter((b:any) => b.status === 'completed').reduce((s:any, b:any) => s + Number(b.servicePrice), 0)
    const stats = [
        { label: 'Total Users', value: users.filter((u:any) => u.role === 'customer').length, icon: '👥', color: '#6366F1', bg: '#EEF2FF' },
        { label: 'Active Shops', value: shops.filter((s:any) => s.is_approved).length, icon: '🏪', color: '#FF6B35', bg: '#FFF3EE' },
        { label: 'Total Orders', value: bookings.length, icon: '📋', color: '#0EA5E9', bg: '#F0F9FF' },
        { label: 'Revenue', value: `₹${totalRevenue}`, icon: '💰', color: '#059669', bg: '#ECFDF5' },
    ]
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Platform Overview</h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: s.bg }}>{s.icon}</div>
                        </div>
                        <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-gray-400 text-xs mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-[#1A1A2E]">Pending Shop Approvals</h3>
                        <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                            {shops.filter((s:any) => !s.is_approved).length} pending
                        </span>
                    </div>
                    {shops.filter((s:any) => !s.is_approved).length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">All shops are approved ✅</div>
                    ) : (
                        shops.filter((s:any) => !s.is_approved).slice(0, 3).map((s:any) => (
                            <div key={s.id} className="p-4 border-b border-gray-50 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm">{s.name}</p>
                                    <p className="text-xs text-gray-400">{s.city}</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Review</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-[#1A1A2E]">Recent Bookings</h3>
                    </div>
                    {bookings.slice(0, 3).map((b:any, i:number) => (
                        <div key={b.id} className={`px-5 py-3.5 flex items-center gap-3 ${i < 2 ? 'border-b border-gray-50' : ''}`}>
                            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-sm font-bold text-[#FF6B35]">
                                #{i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-[#1A1A2E] truncate">{b.userName} → {b.shopName}</p>
                                <p className="text-gray-400 text-xs">{b.serviceName}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    b.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                }`}>{b.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function UsersView({ users: initialUsers }: any) {
    const [users, setUsers] = useState(initialUsers)
    const toggleBlock = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus
        await supabase.from('users').update({ isBlocked: newStatus }).eq('id', id)
        setUsers((prev:any) => prev.map((u:any) => u.id === id ? { ...u, isBlocked: newStatus } : u))
    }

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Manage Users ({users.length})</h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 grid grid-cols-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span>User</span><span>Phone</span><span>Role</span><span>Action</span>
                </div>
                {users.map((user:any, i:number) => (
                    <div key={user.id} className={`px-5 py-4 grid grid-cols-4 items-center gap-2 ${i < users.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-pink-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {user.name?.[0] || 'U'}
                            </div>
                            <span className="font-semibold text-sm text-[#1A1A2E] truncate">{user.name}</span>
                        </div>
                        <span className="text-gray-500 text-sm">{user.phone}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'provider' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                            }`}>{user.role}</span>
                        <button onClick={() => toggleBlock(user.id, user.isBlocked)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg w-fit transition-colors ${user.isBlocked ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                            {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

import AdminLocationPicker from '../components/AdminLocationPicker'

function ShopsView({ shops: initialShops, categories }: any) {
    const [shops, setShops] = useState(initialShops)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form states
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [ownerName, setOwnerName] = useState('')
    const [shopName, setShopName] = useState('')
    const [category, setCategory] = useState(categories[0]?.id || 'mobile-repair')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('Bangalore')
    
    // Map Location states
    const [latitude, setLatitude] = useState(0)
    const [longitude, setLongitude] = useState(0)
    const [isMapOpen, setIsMapOpen] = useState(false)

    const toggleApprove = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus
        await supabase.from('shops').update({ is_approved: newStatus }).eq('id', id)
        setShops((prev:any) => prev.map((s:any) => s.id === id ? { ...s, is_approved: newStatus } : s))
    }

    const handleLocationSelect = (lat: number, lng: number, addr: string) => {
        setLatitude(lat)
        setLongitude(lng)
        if (!address) setAddress(addr)
    }

    const handleAddShop = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!latitude || !longitude) return setError('Please drop a PIN on the map for the shop location.')
        
        setLoading(true)
        setError('')
        
        // Check if a user already exists with this phone number
        let { data: user, error: fetchErr } = await supabase.from('users').select('*').eq('phone', phone).maybeSingle()
        
        if (!user) {
            // Create a new provider user (no manual ID — let DB auto-assign or use a safe unique ID)
            const newUser = {
                id: `p${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name: ownerName,
                phone,
                password,
                role: 'provider'
            }
            const { data: created, error: uErr } = await supabase.from('users').insert(newUser).select().single()
            if (uErr) {
                // Show the actual database error so we can debug it
                setError(`Failed to create user: ${uErr.message}`)
                setLoading(false)
                return
            }
            user = created
        } else {
            // User already exists — just update their password for the provider login
            const { error: pErr } = await supabase.from('users').update({ name: ownerName, password, role: 'provider' }).eq('id', user.id)
            if (pErr) console.error('Failed to update existing user:', pErr)
        }
        
        const newShop = {
            id: `s${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            owner_id: user!.id,
            name: shopName,
            category: [category],
            city,
            address,
            phone,
            rating: 5.0,
            is_approved: true,
            is_open: true,
            open_time: '09:00 AM',
            close_time: '08:00 PM',
            price_range: '₹100 - ₹500',
            latitude,
            longitude,
            images: ['https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800']
        }
        
        const { data: shopCreated, error: sErr } = await supabase.from('shops').insert(newShop).select('*').single()
        if (sErr) { setError(`Failed to create shop: ${sErr.message}`); setLoading(false); return }
        
        setShops((prev:any) => [shopCreated, ...prev])
        setIsAdding(false)
        setLoading(false)
        
        // Reset form
        setPhone(''); setPassword(''); setOwnerName(''); setShopName(''); setAddress(''); setLatitude(0); setLongitude(0);
    }

    return (
        <div className="animate-fade-in relative h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-[#1A1A2E]">Manage Shops ({shops.length})</h2>
                <button onClick={() => setIsAdding(true)} className="bg-[#1A1A2E] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-transform">+ Add Shop Manually</button>
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#1A1A2E]">Add New Shop</h3>
                            <button onClick={() => setIsAdding(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold hover:bg-gray-200">✕</button>
                        </div>

                        {error && <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl mb-4 border border-red-100">{error}</div>}

                        <form onSubmit={handleAddShop} className="flex flex-col gap-3">
                            <input type="text" required placeholder="Owner Name" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                            <div className="flex gap-3">
                                <input type="text" required placeholder="Owner Phone (+91...)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                                <input type="text" required placeholder="Set Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                            </div>
                            <input type="text" required placeholder="Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                            <div className="flex gap-3">
                                <select value={category} onChange={e => setCategory(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm">
                                    {categories.map((cat: any) => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                                <input type="text" required placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                            </div>
                            <input type="text" required placeholder="Full Address" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                            
                            <button type="button" onClick={() => setIsMapOpen(true)} className={`w-full border rounded-xl px-4 py-3 outline-none font-semibold text-sm flex items-center justify-between transition-colors ${latitude ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-[#FF6B35]'}`}>
                                <span className="truncate">{latitude ? `📍 PIN Set (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` : '📍 Drop PIN on Map (Required)'}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${latitude ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>{latitude ? 'Change' : 'Select'}</span>
                            </button>
                            
                            <button disabled={loading || !latitude} type="submit" className="w-full bg-[#FF6B35] text-white py-3.5 rounded-xl font-black text-base mt-2 transition-transform active:scale-95 disabled:opacity-70 shadow-lg shadow-orange-500/20">
                                {loading ? 'Adding...' : 'Create Shop'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
            <AdminLocationPicker isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} onSelect={handleLocationSelect} />

            <div className="flex flex-col gap-4">
                {shops.map((shop:any) => (
                    <div key={shop.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 items-center shadow-sm">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                            <Image
                                src={shop.images?.[0] || 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800'}
                                alt={shop.name}
                                fill
                                sizes="56px"
                                unoptimized
                                className="object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1A1A2E]">{shop.name}</p>
                            <p className="text-gray-400 text-xs truncate">{shop.address}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-amber-500 text-xs font-bold">★ {shop.rating}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-400 text-xs truncate">{shop.category?.map((c:any) => {
                                    const catObj = categories.find((cx:any) => cx.id === c);
                                    return catObj ? catObj.label : c.replace(/-/g, ' ');
                                }).join(', ')}</span>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full block mb-2 ${shop.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {shop.is_approved ? '✓ Approved' : '⏳ Pending'}
                            </span>
                            <button onClick={() => toggleApprove(shop.id, shop.is_approved)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${shop.is_approved ? 'bg-red-50 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                {shop.is_approved ? 'Revoke' : 'Approve'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function CategoriesView({ categories, onUpdate }: any) {
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ id: '', label: '', icon: '🔧', color: '#6366F1' })

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Ensure ID is set (slugify label if missing)
        const finalId = form.id.trim() || form.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        
        // Check for local duplicates first
        if (categories.find((c: any) => c.id === finalId)) {
            alert(`A category with the ID "${finalId}" already exists. Please use a different name or ID.`)
            return
        }

        setLoading(true)
        const newCat = { ...form, id: finalId, order: categories.length + 1 }
        
        const { data, error } = await supabase.from('categories').insert(newCat).select().single()
        if (!error) {
            onUpdate([...categories, data])
            setIsAdding(false)
            setForm({ id: '', label: '', icon: '🔧', color: '#6366F1' })
        } else {
            if (error.code === '23505') {
                alert(`Error: A category with the ID "${finalId}" already exists in the database.`)
            } else {
                alert('Failed to add category: ' + error.message)
            }
        }
        setLoading(false)
    }

    const deleteCategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category? This might affect existing shops.')) return
        
        setLoading(true)
        const { error } = await supabase.from('categories').delete().eq('id', id)
        
        if (error) {
            alert('Failed to delete category: ' + error.message + '\n\nPlease ensure you have run the required SQL policies.')
        } else {
            onUpdate(categories.filter((c: any) => c.id !== id))
        }
        setLoading(false)
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[#1A1A2E]">Service Categories</h2>
                    <p className="text-gray-400 text-sm mt-1">Manage all services available on the platform</p>
                </div>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="bg-[#FF6B35] text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-orange-500/20 hover:scale-105 transition-all flex items-center gap-2">
                        <span className="text-xl">+</span> Add New Category
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white rounded-[32px] p-8 border-2 border-[#FF6B35]/20 shadow-xl mb-10 animate-slide-up relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#FF6B35]"></div>
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-[#1A1A2E]">Create New Category</h3>
                        <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-red-500 font-bold transition-colors">Cancel</button>
                    </div>
                    
                    <form onSubmit={handleAdd} className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[#FF6B35] uppercase tracking-widest ml-1">Display Name</label>
                                <input 
                                    required 
                                    autoFocus
                                    placeholder="e.g. Car Wash"
                                    value={form.label} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        const slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                        setForm({ ...form, label: val, id: slug });
                                    }} 
                                    className="w-full border-b-2 border-gray-100 py-3 outline-none focus:border-[#FF6B35] font-bold text-lg placeholder:text-gray-200 transition-all" 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">System ID (Slug)</label>
                                <input 
                                    required 
                                    placeholder="car-wash"
                                    value={form.id} 
                                    onChange={e => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })} 
                                    className="w-full border-b-2 border-gray-100 py-3 outline-none focus:border-[#FF6B35] font-mono text-sm text-gray-400 placeholder:text-gray-200 transition-all" 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Icon Emoji</label>
                                <input 
                                    required 
                                    value={form.icon} 
                                    onChange={e => setForm({ ...form, icon: e.target.value })} 
                                    className="w-full border-b-2 border-gray-100 py-3 outline-none focus:border-[#FF6B35] font-bold text-3xl transition-all" 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Theme Color</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl shadow-lg shrink-0" style={{ backgroundColor: form.color }}></div>
                                    <input 
                                        required 
                                        value={form.color} 
                                        onChange={e => setForm({ ...form, color: e.target.value })} 
                                        className="w-full border-b-2 border-gray-100 py-3 outline-none focus:border-[#FF6B35] font-bold text-sm transition-all" 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <button disabled={loading} type="submit" className="bg-[#1A1A2E] text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                                {loading ? 'Saving...' : 'Add Category Now'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat: any) => (
                    <div key={cat.id} className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm group hover:shadow-xl hover:border-[#FF6B35]/20 transition-all">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                            {cat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1A1A2E] text-lg">{cat.label}</p>
                            <p className="text-gray-400 text-[10px] font-mono uppercase tracking-widest">{cat.id}</p>
                        </div>
                        <button onClick={() => deleteCategory(cat.id)} className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white">✕</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function OrdersView({ bookings }: any) {
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Order Monitoring ({bookings.length})</h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 grid grid-cols-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span>ID</span><span>Customer</span><span>Shop & Service</span><span>Amount</span><span>Status</span>
                </div>
                {bookings.map((b:any, i:number) => (
                    <div key={b.id} className={`px-5 py-4 grid grid-cols-5 items-center gap-2 text-sm ${i < bookings.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <span className="text-gray-400 font-mono text-xs">#{b.id}</span>
                        <span className="font-semibold text-[#1A1A2E] truncate">{b.userName}</span>
                        <div className="min-w-0">
                            <p className="text-[#1A1A2E] font-semibold truncate text-xs">{b.shopName}</p>
                            <p className="text-gray-400 text-xs truncate">{b.serviceName}</p>
                        </div>
                        <span className="font-bold text-[#FF6B35]">₹{b.servicePrice}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                b.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                    b.status === 'on-the-way' ? 'bg-purple-100 text-purple-700' :
                                        'bg-amber-100 text-amber-700'
                            }`}>{b.status}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AnalyticsView({ bookings }: any) {
    const completed = bookings.filter((b:any) => b.status === 'completed')
    
    // Calculate Monthly Revenue dynamically
    const monthlyMap: Record<string, number> = {}
    completed.forEach((b:any) => {
        const date = new Date(b.created_at || Date.now())
        const monthName = date.toLocaleDateString('en-US', { month: 'short' })
        if (!monthlyMap[monthName]) monthlyMap[monthName] = 0
        monthlyMap[monthName] += Number(b.servicePrice) || 0
    })
    
    const MONTHLY = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const m = d.toLocaleDateString('en-US', { month: 'short' })
        MONTHLY.push({ month: m, revenue: monthlyMap[m] || 0 })
    }
    const maxRevenue = Math.max(...MONTHLY.map(m => m.revenue), 1000)

    // Calculate Category Revenue dynamically
    const categoryMap: Record<string, number> = {}
    let totalRev = 0
    completed.forEach((b:any) => {
        const cat = b.shops?.category?.[0] || 'other'
        if (!categoryMap[cat]) categoryMap[cat] = 0
        categoryMap[cat] += Number(b.servicePrice) || 0
        totalRev += Number(b.servicePrice) || 0
    })
    
    const colors = ['#FF6B35', '#6366F1', '#0EA5E9', '#059669', '#EAB308', '#D946EF']
    const CATEGORIES_REVENUE = Object.keys(categoryMap)
        .map((cat, i) => ({
            cat: cat.replace(/-/g, ' '),
            pct: totalRev > 0 ? Math.round((categoryMap[cat] / totalRev) * 100) : 0,
            color: colors[i % colors.length]
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5) // Top 5 categories

    const avgOrderValue = completed.length ? Math.round(totalRev / completed.length) : 0
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Analytics</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Completed Orders', value: completed.length.toString(), icon: '📈', color: '#059669' },
                    { label: 'Avg Order Value', value: `₹${avgOrderValue}`, icon: '💳', color: '#6366F1' },
                    { label: 'Customer Satisfaction', value: '4.8 ★', icon: '⭐', color: '#EAB308' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                        <span className="text-2xl">{s.icon}</span>
                        <p className="font-black text-xl mt-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-[#1A1A2E] mb-4">Monthly Revenue (₹)</h3>
                    <div className="flex items-end gap-3 h-40">
                        {MONTHLY.map(m => (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full rounded-t-lg relative group cursor-pointer"
                                    style={{ height: `${(m.revenue / maxRevenue) * 100}%`, background: 'linear-gradient(to top, #FF6B35, #FFA05C)' }}>
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1A1A2E] text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                                        ₹{m.revenue.toLocaleString()}
                                    </div>
                                </div>
                                <span className="text-[11px] text-gray-500 font-medium">{m.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-[#1A1A2E] mb-4">Revenue by Category</h3>
                    <div className="flex flex-col gap-3">
                        {CATEGORIES_REVENUE.map(cat => (
                            <div key={cat.cat}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{cat.cat}</span>
                                    <span className="font-bold" style={{ color: cat.color }}>{cat.pct}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${cat.pct}%`, background: cat.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function BroadcastView({ users }: { users: any[] }) {
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !message) return
        if (!confirm(`Are you sure you want to send this notification to ALL ${users.length} users?`)) return

        setLoading(true)
        setProgress(0)
        
        let sentCount = 0
        const total = users.length
        
        for (const user of users) {
            const { error } = await supabase.from('notifications').insert({
                user_id: user.id,
                title,
                message,
                type: 'info'
            })
            if (error) {
                console.error('Failed to send to user', user.id, JSON.stringify(error, null, 2))
            } else {
                sentCount++
            }
            setProgress(Math.floor((sentCount / total) * 100))
        }

        alert(`Successfully sent broadcast to ${sentCount} users!`)
        setTitle('')
        setMessage('')
        setLoading(false)
        setProgress(0)
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto py-4">
            <div className="text-center mb-10">
                <div className="w-24 h-24 bg-orange-100 rounded-[32px] flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg shadow-orange-500/10">📣</div>
                <h2 className="text-3xl font-black text-[#1A1A2E]">Broadcast Message</h2>
                <p className="text-gray-400 mt-2 font-medium">Send a custom notification to all {users.length} platform users instantly</p>
            </div>

            <form onSubmit={handleBroadcast} className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl space-y-8">
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Announcement Title</label>
                    <input 
                        required
                        placeholder="e.g. Happy Diwali! 🪔 Exclusive 20% Off Today!"
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4.5 outline-none focus:border-[#FF6B35] focus:bg-white font-bold transition-all"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Message Content</label>
                    <textarea 
                        required
                        rows={5}
                        placeholder="Type your announcement details here..."
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4.5 outline-none focus:border-[#FF6B35] focus:bg-white font-semibold text-sm resize-none transition-all"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                </div>

                {loading && (
                    <div className="space-y-3 p-2">
                        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span>Broadcasting...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C35] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                <button 
                    disabled={loading}
                    type="submit"
                    className="w-full bg-[#1A1A2E] text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {loading ? `Sending to ${users.length} users...` : '📣 Send Broadcast Now'}
                </button>
            </form>

            <div className="mt-10 bg-[#FF6B35]/5 border-2 border-[#FF6B35]/10 p-6 rounded-3xl flex gap-5 items-start">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 text-2xl">💡</div>
                <div className="space-y-1">
                    <p className="text-[#1A1A2E] font-black text-sm">Pro Tip</p>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        This message will trigger a **Native Notification** pop-up on all user devices (Customer & Provider). Use this for critical updates, festive wishes, or high-value promotions.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function AdminPanel() {
    const [activeView, setActiveView] = useState<View>('dashboard')
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const [users, setUsers] = useState<any[]>([])
    const [shops, setShops] = useState<any[]>([])
    const [bookings, setBookings] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const { data: u } = await supabase.from('users').select('*').order('created_at', { ascending: false })
            const { data: s } = await supabase.from('shops').select('*').order('name')
            const { data: b } = await supabase
                .from('bookings')
                .select('*, users(name), shops(name, category), services(name)')
                .order('created_at', { ascending: false })
            const { data: c } = await supabase.from('categories').select('*').order('order')
            
            if (u) setUsers(u)
            if (s) setShops(s)
            if (c) setCategories(c)
            
            if (b) setBookings(b.map((bx:any) => ({
                ...bx,
                userName: bx.users?.name || 'User',
                shopName: bx.shops?.name || 'Shop',
                serviceName: bx.services?.name || 'Service',
                servicePrice: bx.service_price
            })))
            setLoading(false)
        }
        load()
    }, [])

    if (loading) return <div className="p-10 text-gray-400">Loading Admin Portal...</div>

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView users={users} shops={shops} bookings={bookings} />
            case 'users': return <UsersView users={users} />
            case 'shops': return <ShopsView shops={shops} categories={categories} />
            case 'categories': return <CategoriesView categories={categories} onUpdate={(newCats: any) => setCategories(newCats)} />
            case 'orders': return <OrdersView bookings={bookings} />
            case 'broadcast': return <BroadcastView users={users} />
            case 'emergency': return <EmergencyManager />
            case 'banners': return <BannerManager />
            case 'analytics': return <AnalyticsView bookings={bookings} />
        }
    }

    return (
        <div className="min-h-screen flex bg-[#F4F6F9]">
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1A2E] transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-6 py-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#E85A24] flex items-center justify-center text-xl">⚡</div>
                        <div>
                            <p className="text-white font-black text-lg leading-none">QuickFix</p>
                            <p className="text-white/40 text-xs">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <nav className="px-3 mt-4 flex flex-col gap-1">
                    {NAV.map(item => (
                        <button key={item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false) }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${activeView === item.id ? 'bg-[#FF6B35] text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-6 left-0 right-0 px-4">
                    <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">A</div>
                        <div>
                            <p className="text-white text-xs font-bold">Admin User</p>
                            <p className="text-white/40 text-[11px]">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg width="18" height="18" fill="none" stroke="#1A1A2E" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="font-black text-[#1A1A2E] text-lg capitalize">{NAV.find(n => n.id === activeView)?.label}</h1>
                        <p className="text-gray-400 text-xs">QuickFix Platform Management</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:block text-gray-400 text-xs">QuickFix v1.0</span>
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-black text-sm">A</div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    )
}

function EmergencyManager() {
    const [bookings, setBookings] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showServiceEditor, setShowServiceEditor] = useState(false)
    const [newService, setNewService] = useState({ name: '', icon: '🚑', charge: 500, estimated_time: '20 mins', description: '' })

    useEffect(() => {
        fetchEmergencyData()
        const channel = supabase.channel('emergency-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_bookings' }, () => fetchEmergencyData())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchEmergencyData = async () => {
        const { data: b } = await supabase.from('emergency_bookings').select('*, service:emergency_services(*)').order('created_at', { ascending: false })
        const { data: s } = await supabase.from('emergency_services').select('*').order('name')
        if (b) setBookings(b)
        if (s) setServices(s)
        setLoading(false)
    }

    const handleAddService = async () => {
        if (!newService.name || !newService.charge) {
            alert('Please fill at least name and charge')
            return
        }
        const { error } = await supabase.from('emergency_services').insert(newService)
        if (error) {
            console.error('Error adding emergency service:', error)
            alert('Failed to add service: ' + error.message)
        } else {
            setShowServiceEditor(false)
            setNewService({ name: '', icon: '🚑', charge: 500, estimated_time: '20 mins', description: '' })
            fetchEmergencyData()
        }
    }

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('emergency_bookings').update({ status }).eq('id', id)
        fetchEmergencyData()
    }

    if (loading) return <div className="p-10 animate-pulse text-gray-400">Syncing Emergency Dashboard...</div>

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-red-600 rounded-[32px] p-6 text-white shadow-xl shadow-red-600/20">
                    <p className="text-4xl font-black mb-1">{bookings.filter(b => b.status === 'EMERGENCY_PENDING').length}</p>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-70">Critical Pending</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100">
                    <p className="text-4xl font-black text-[#1A1A2E] mb-1">{bookings.filter(b => b.status === 'ACCEPTED').length}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Response</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100">
                    <p className="text-4xl font-black text-emerald-600 mb-1">{bookings.filter(b => b.status === 'COMPLETED').length}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resolved Today</p>
                </div>
                <div className="bg-[#1A1A2E] rounded-[32px] p-6 text-white">
                    <p className="text-4xl font-black mb-1">₹{bookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + Number(b.emergency_charge), 0)}</p>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">SOS Revenue</p>
                </div>
            </div>

            {/* Service Control */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-[#1A1A2E]">Emergency Service Manager</h3>
                    <button onClick={() => setShowServiceEditor(!showServiceEditor)} className="bg-red-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                        {showServiceEditor ? 'Close Editor' : 'Manage Services'}
                    </button>
                </div>

                {showServiceEditor && (
                    <div className="grid grid-cols-4 gap-4 mb-8 bg-gray-50 p-6 rounded-3xl animate-slide-up">
                        <input placeholder="Service Name" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="bg-white border-none rounded-xl p-3 text-sm font-bold shadow-sm" />
                        <input placeholder="Charge (₹)" type="number" value={newService.charge} onChange={e => setNewService({...newService, charge: Number(e.target.value)})} className="bg-white border-none rounded-xl p-3 text-sm font-bold shadow-sm" />
                        <input placeholder="Response Time" value={newService.estimated_time} onChange={e => setNewService({...newService, estimated_time: e.target.value})} className="bg-white border-none rounded-xl p-3 text-sm font-bold shadow-sm" />
                        <button onClick={handleAddService} className="bg-[#1A1A2E] text-white rounded-xl font-bold">Add Service</button>
                    </div>
                )}

                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {services.map(s => (
                        <div key={s.id} className="min-w-[200px] bg-gray-50 p-4 rounded-3xl border border-transparent hover:border-red-200 transition-all">
                            <div className="text-2xl mb-2">{s.icon}</div>
                            <p className="font-black text-[#1A1A2E] text-sm">{s.name}</p>
                            <p className="text-red-600 font-bold text-xs mt-1">₹{s.charge} • {s.estimated_time}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Requests */}
            <div className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-xl">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-[#1A1A2E]">Live SOS Requests</h3>
                    <div className="flex gap-2">
                        <span className="bg-red-100 text-red-600 text-[10px] font-black px-3 py-1 rounded-full animate-pulse">LIVE MONITORING</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-8 py-5">Customer / Issue</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Priority</th>
                                <th className="px-8 py-5">Charge</th>
                                <th className="px-8 py-5">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {bookings.map(b => (
                                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-2xl">{b.service?.icon || '🆘'}</div>
                                            <div>
                                                <p className="font-black text-[#1A1A2E] text-sm">{b.user_name}</p>
                                                <p className="text-gray-400 text-xs font-bold">{b.problem_title}</p>
                                                <p className="text-red-500 text-[10px] font-bold mt-1">📞 {b.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                            b.status === 'EMERGENCY_PENDING' ? 'bg-red-100 text-red-600 animate-pulse' :
                                            b.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-600' :
                                            b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {b.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`font-black text-xs ${b.priority_level === 'Critical' ? 'text-red-600' : b.priority_level === 'High' ? 'text-orange-600' : 'text-blue-600'}`}>
                                            {b.priority_level}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 font-black text-[#1A1A2E]">₹{b.emergency_charge}</td>
                                    <td className="px-8 py-6">
                                        <select 
                                            value={b.status} 
                                            onChange={(e) => updateStatus(b.id, e.target.value)}
                                            className="bg-gray-100 border-none rounded-xl px-3 py-2 text-[10px] font-black outline-none"
                                        >
                                            <option value="EMERGENCY_PENDING">Pending</option>
                                            <option value="ACCEPTED">Accept</option>
                                            <option value="TECHNICIAN_ASSIGNED">Assign Tech</option>
                                            <option value="COMPLETED">Complete</option>
                                            <option value="CANCELLED">Cancel</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function BannerManager() {
    const [banners, setBanners] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [form, setForm] = useState({ title: '', subtitle: '', emoji: '🎁', bg_color: 'from-orange-500 to-red-500' })

    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        setLoading(true)
        const { data } = await supabase.from('banners').select('*').order('created_at', { ascending: false })
        if (data) setBanners(data)
        setLoading(false)
    }

    const handleSave = async () => {
        const { error } = await supabase.from('banners').insert(form)
        if (!error) {
            fetchBanners()
            setIsAdding(false)
            setForm({ title: '', subtitle: '', emoji: '🎁', bg_color: 'from-orange-500 to-red-500' })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this banner?')) return
        await supabase.from('banners').delete().eq('id', id)
        fetchBanners()
    }

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[#1A1A2E] leading-tight mb-2">Banner Manager</h2>
                    <p className="text-gray-500 font-medium italic">Create and manage top-scroll offers in real-time.</p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-[#FF6B35] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <span>➕</span> Add New Banner
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-gray-100 mb-8 animate-slide-up">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-2 h-8 bg-[#FF6B35] rounded-full"></span>
                        Create New Offer Banner
                    </h3>
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Banner Title</label>
                            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1A1A2E]" placeholder="e.g. 20% Off Electrical" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Subtitle / Validity</label>
                            <input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1A1A2E]" placeholder="e.g. Use code FLASH20" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Emoji</label>
                            <input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1A1A2E]" placeholder="e.g. ⚡" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Gradient Background</label>
                            <select value={form.bg_color} onChange={e => setForm({...form, bg_color: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-[#1A1A2E]">
                                <option value="from-orange-500 to-red-500">Orange Sunset</option>
                                <option value="from-blue-500 to-cyan-500">Deep Blue</option>
                                <option value="from-emerald-500 to-teal-500">Nature Green</option>
                                <option value="from-purple-500 to-pink-500">Purple Haze</option>
                                <option value="from-gray-800 to-black">Sleek Black</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleSave} className="bg-[#1A1A2E] text-white px-8 py-4 rounded-2xl font-bold flex-1">Save Banner</button>
                        <button onClick={() => setIsAdding(false)} className="bg-gray-100 text-gray-500 px-8 py-4 rounded-2xl font-bold">Cancel</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {banners.map(banner => (
                    <div key={banner.id} className="bg-white p-6 rounded-[32px] shadow-lg border border-gray-100 relative group overflow-hidden">
                        <div className={`h-32 bg-gradient-to-r ${banner.bg_color} rounded-2xl p-5 flex items-center justify-between mb-4`}>
                            <div>
                                <p className="text-white font-black text-lg leading-tight">{banner.title}</p>
                                <p className="text-white/80 text-xs mt-1">{banner.subtitle}</p>
                            </div>
                            <span className="text-5xl">{banner.emoji}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleDelete(banner.id)} className="bg-red-50 text-red-500 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
