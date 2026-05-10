'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/data'
import AuthGuard from '@/components/AuthGuard'

export default function AddressesPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [addresses, setAddresses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAddresses = async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchErr } = await supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', user.uid)
                .order('is_default', { ascending: false })
            
            if (fetchErr) throw fetchErr
            setAddresses(data || [])
        } catch (err: any) {
            console.error('Fetch Addresses Error:', err)
            setError('Failed to load saved addresses.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAddresses()
    }, [user])

    const deleteAddress = async (id: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return
        try {
            const { error: delErr } = await supabase.from('user_addresses').delete().eq('id', id)
            if (delErr) throw delErr
            setAddresses(prev => prev.filter(a => a.id !== id))
        } catch (err: any) {
            alert('Failed to delete address: ' + err.message)
        }
    }

    const setAsDefault = async (id: string) => {
        try {
            // 1. Unset all defaults
            await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user?.uid)
            // 2. Set this one as default
            const { error: updErr } = await supabase.from('user_addresses').update({ is_default: true }).eq('id', id)
            if (updErr) throw updErr
            
            setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))
        } catch (err: any) {
            alert('Failed to set default: ' + err.message)
        }
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-white pb-24">
                {/* Header */}
                <div className="px-5 pt-12 pb-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-[#1A1A2E]">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </button>
                        <h1 className="font-black text-[#1A1A2E] text-2xl">Saved Addresses</h1>
                    </div>
                    <Link href="/location-setup?returnTo=/profile/addresses">
                        <button className="w-10 h-10 bg-[#FF6B35] text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-orange-500/20">+</button>
                    </Link>
                </div>

                <div className="px-5 pt-6">
                    {loading ? (
                        <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div></div>
                    ) : error ? (
                        <div className="text-center py-10 bg-red-50 rounded-3xl border border-red-100 px-6">
                            <span className="text-4xl">⚠️</span>
                            <p className="text-red-600 font-bold mt-4">Database Table Missing</p>
                            <p className="text-red-400 text-xs mt-1">Please ensure 'user_addresses' table exists in Supabase.</p>
                            <button onClick={fetchAddresses} className="mt-4 bg-[#1A1A2E] text-white px-6 py-2 rounded-xl font-bold text-sm">Retry</button>
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                            <span className="text-6xl grayscale opacity-50">📍</span>
                            <p className="text-gray-500 font-bold mt-5">No addresses saved</p>
                            <p className="text-gray-400 text-xs mt-1 max-w-[200px] mx-auto">Save your home, office or shop address for faster bookings.</p>
                            <Link href="/location-setup?returnTo=/profile/addresses" className="mt-6 inline-block bg-[#FF6B35] text-white px-8 py-3 rounded-full font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-transform">
                                Add New Address
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {addresses.map(addr => (
                                <div key={addr.id} className={`p-5 rounded-3xl border transition-all ${addr.is_default ? 'border-[#FF6B35] bg-orange-50/30' : 'border-gray-100 bg-white'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{addr.type === 'Home' ? '🏠' : addr.type === 'Office' ? '🏢' : '📍'}</span>
                                            <p className="font-black text-[#1A1A2E]">{addr.type || 'Other'}</p>
                                            {addr.is_default && <span className="bg-[#FF6B35] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Default</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => deleteAddress(addr.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">✕</button>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{addr.full_address}</p>
                                    {!addr.is_default && (
                                        <button onClick={() => setAsDefault(addr.id)} className="text-[#FF6B35] text-xs font-bold hover:underline">Set as Default</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    )
}
