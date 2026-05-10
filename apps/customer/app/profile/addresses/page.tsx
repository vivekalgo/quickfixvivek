'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/data'
import AuthGuard from '@/components/AuthGuard'

export default function AddressesPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [addresses, setAddresses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAddresses = async () => {
            if (!user) return
            // For now, we'll fetch from a hypothetical 'addresses' table 
            // or just show the last used location from localStorage as a 'Saved' one
            const saved = typeof window !== 'undefined' ? localStorage.getItem('qf_location') : null
            if (saved) {
                setAddresses([{ id: 'default', address: saved, label: 'Current Location' }])
            }
            setLoading(false)
        }
        fetchAddresses()
    }, [user])

    return (
        <AuthGuard>
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100 flex items-center gap-4">
                <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-[#1A1A2E]">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h1 className="font-black text-[#1A1A2E] text-xl">Saved Addresses</h1>
            </div>

            <div className="p-5">
                {loading ? (
                    <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div></div>
                ) : addresses.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-8 text-center border-2 border-dashed border-gray-200">
                        <span className="text-5xl mb-4 block">📍</span>
                        <p className="font-bold text-[#1A1A2E]">No saved addresses</p>
                        <p className="text-gray-400 text-sm mt-1">Your home and work addresses will appear here</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {addresses.map(addr => (
                            <div key={addr.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-xl shrink-0">🏠</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#1A1A2E]">{addr.label}</p>
                                    <p className="text-gray-400 text-xs leading-relaxed mt-1">{addr.address}</p>
                                </div>
                                <button className="text-red-500 text-xs font-bold">Delete</button>
                            </div>
                        ))}
                        <button className="w-full bg-[#1A1A2E] text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-transform mt-4">
                            + Add New Address
                        </button>
                    </div>
                )}
            </div>
        </div>
        </AuthGuard>
    )
}
