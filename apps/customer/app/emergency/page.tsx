'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/data'
import { useAuth } from '@/lib/AuthContext'
import { getCurrentPosition, reverseGeocode } from '@/lib/locationPermission'

export default function EmergencyPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    
    const [selectedService, setSelectedService] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        altPhone: '',
        address: '',
        problemTitle: '',
        description: '',
        priority: 'High' as 'Critical' | 'High' | 'Medium',
        lat: null as number | null,
        lng: null as number | null
    })

    // Update form data when user is loaded
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.displayName || prev.name,
                phone: user.phone || prev.phone
            }))
        }
    }, [user])

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        const fetchServices = async () => {
            const { data } = await supabase.from('emergency_services').select('*').eq('is_active', true)
            if (data) setServices(data)
            setLoading(false)
        }

        const detectLocation = async () => {
            const pos = await getCurrentPosition()
            if (pos.ok) {
                setFormData(prev => ({ ...prev, lat: pos.coords[0], lng: pos.coords[1] }))
                const addr = await reverseGeocode(pos.coords[0], pos.coords[1])
                if (addr) setFormData(prev => ({ ...prev, address: addr }))
            }
        }

        fetchServices()
        detectLocation()

        const channel = supabase.channel('emergency-services-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_services' }, () => {
                fetchServices()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    if (!mounted) return null // Prevent SSR/Build crashes

    const handleBooking = async () => {
        if (!selectedService) return
        setSubmitting(true)
        
        const { error } = await supabase.from('emergency_bookings').insert({
            user_id: user?.uid,
            user_name: formData.name,
            phone: formData.phone,
            alt_phone: formData.altPhone,
            address: formData.address,
            latitude: formData.lat,
            longitude: formData.lng,
            service_id: selectedService.id,
            problem_title: formData.problemTitle,
            description: formData.description,
            priority_level: formData.priority,
            emergency_charge: selectedService.charge,
            status: 'EMERGENCY_PENDING'
        })

        if (!error) {
            setStep(3)
        } else {
            console.error('Booking Error:', error)
            alert('Failed to create booking: ' + error.message)
        }
        setSubmitting(false)
    }

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-bold animate-pulse">Initializing Emergency Support...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-10">
            {/* Header */}
            <div className="bg-gradient-to-br from-red-600 to-rose-700 px-5 pt-14 pb-8 text-white rounded-b-[40px] shadow-xl">
                <button onClick={() => router.back()} className="mb-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/20">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-4xl animate-pulse">🚨</div>
                    <div>
                        <h1 className="text-2xl font-black leading-tight">Emergency Help</h1>
                        <p className="text-white/70 text-xs font-bold tracking-widest uppercase">Instant Response System</p>
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-6">
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 mb-6">
                            <h2 className="text-[#1A1A2E] font-black text-lg mb-1">Select Service Type</h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">What is your emergency?</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {services.map(s => (
                                <button 
                                    key={s.id}
                                    onClick={() => { setSelectedService(s); setStep(2); }}
                                    className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-5 active:scale-[0.98] transition-all hover:shadow-xl hover:border-red-100 group text-left"
                                >
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-red-50 transition-colors">
                                        {s.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-black text-[#1A1A2E] text-base">{s.name}</h3>
                                            <span className="text-red-600 font-black text-sm">₹{s.charge}</span>
                                        </div>
                                        <p className="text-gray-400 text-xs font-medium line-clamp-1">{s.description}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">⚡ {s.estimated_time}</span>
                                            <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">24x7 Available</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && selectedService && (
                    <div className="animate-slide-up">
                        <div className="bg-white p-6 rounded-[40px] shadow-2xl border border-gray-100 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[#1A1A2E] font-black text-xl">Provide Details</h2>
                                <span className="bg-red-50 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{selectedService.name}</span>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
                                        <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-sm outline-none focus:ring-2 ring-red-500/20" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
                                        <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-sm outline-none focus:ring-2 ring-red-500/20" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Exact Address / Landmark</label>
                                    <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-sm outline-none focus:ring-2 ring-red-500/20 resize-none" />
                                    <p className="text-[9px] text-emerald-500 font-bold mt-1 flex items-center gap-1">📍 GPS Coordinates Captured Automatically</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Problem Title</label>
                                    <input value={formData.problemTitle} onChange={e => setFormData({...formData, problemTitle: e.target.value})} placeholder="e.g. Sparking in Main Board" className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-sm outline-none focus:ring-2 ring-red-500/20" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Explain Problem</label>
                                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the issue in detail..." className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-sm outline-none focus:ring-2 ring-red-500/20 resize-none" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Emergency Level</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Medium', 'High', 'Critical'].map(lv => (
                                            <button 
                                                key={lv} 
                                                onClick={() => setFormData({...formData, priority: lv as any})}
                                                className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-tighter border-2 transition-all ${formData.priority === lv ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                            >
                                                {lv}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleBooking}
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-red-600 to-rose-700 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-red-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>🚀 CONFIRM EMERGENCY BOOKING</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && selectedService && (
                    <div className="animate-fade-in py-10">
                        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center text-5xl mb-6 shadow-inner shadow-emerald-100">
                                ✅
                            </div>
                            <h2 className="text-2xl font-black text-[#1A1A2E] leading-tight mb-3">Request Sent!</h2>
                            <p className="text-gray-400 font-medium text-sm leading-relaxed mb-8 px-4">
                                Our emergency team has been notified. A professional technician will call you within <span className="text-red-600 font-bold">{selectedService.estimated_time}</span>.
                            </p>
                            
                            <div className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 mb-8 text-left flex items-start gap-3">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <p className="text-red-700 font-black text-xs uppercase tracking-tighter">Stay Safe</p>
                                    <p className="text-red-600/70 text-[10px] font-bold">Please stay away from the problematic area until the expert arrives.</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => router.push('/')}
                                className="w-full bg-[#1A1A2E] text-white py-4 rounded-2xl font-bold active:scale-95 transition-all"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
