'use client'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ensureLocationPermissionWithUX, fetchCurrentDevicePosition } from '@/lib/locationPermission'

// Dynamically import the map to avoid SSR issues
const MapPopup = dynamic(() => import('./MapPopup'), { 
    ssr: false, 
    loading: () => <div className="h-[250px] w-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center font-bold text-gray-400">Loading Map...</div> 
})

export default function LocationPicker({ isOpen, onClose, onSelect, initialLocation }: any) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<any[]>([])
    // Default starting point (neutral or initial)
    const [position, setPosition] = useState<[number, number]>(initialLocation?.position || [20.5937, 78.9629]) // India center
    const [addressText, setAddressText] = useState(initialLocation?.address || 'Detecting your location...')
    const [loading, setLoading] = useState(false)
    const [mapRenderKey, setMapRenderKey] = useState(0)
    const [showMap, setShowMap] = useState(false)
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isOpen) {
            setMapRenderKey(prev => prev + 1)
            setShowMap(true)
        } else {
            setShowMap(false)
        }
    }, [isOpen])

    useEffect(() => {
        return () => {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        }
    }, [])

    // Reverse Geocode when position changes from Map click or Current Location
    useEffect(() => {
        const fetchAddress = async () => {
            setLoading(true)
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}`)
                const data = await res.json()
                if (data && data.display_name) {
                    setAddressText(data.display_name)
                }
            } catch (err) {}
            setLoading(false)
        }
        
        // Prevent initial fetch if we haven't clicked/moved yet to optimize (but we want it if they use "Current Location")
        fetchAddress()
    }, [position])

    // Forward Geocode for Search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setQuery(val)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        if (!val.trim()) {
            setSuggestions([])
            return
        }
        
        typingTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&countrycodes=in`)
                const data = await res.json()
                setSuggestions(data)
            } catch (err) {}
        }, 500)
    }

    const selectSuggestion = (s: any) => {
        setPosition([parseFloat(s.lat), parseFloat(s.lon)])
        setQuery('')
        setSuggestions([])
    }

    const useCurrentLocation = async () => {
        setLoading(true)
        try {
            const granted = await ensureLocationPermissionWithUX()
            if (!granted) {
                alert('Location permission required hai. Nearby shops ke liye permission allow karein.')
                return
            }

            const current = await fetchCurrentDevicePosition()
            if (current) {
                setPosition(current)
                return
            }

            alert('Current location fetch nahi ho payi. Thodi der baad dobara try karein.')
        } catch (error) {
            alert('Failed to get location. Please enable location permissions.')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md mx-auto rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-slide-up">
                
                <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h2 className="font-black text-lg text-[#1A1A2E]">Select Location</h2>
                    <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold hover:bg-gray-200">✕</button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5">
                    
                    <button onClick={useCurrentLocation} className="flex items-center gap-3 w-full bg-[#EEF2FF] border border-indigo-100 text-[#6366F1] p-4 rounded-2xl font-bold transition-transform active:scale-95 shadow-sm hover:bg-indigo-50">
                        <span className="text-xl">📍</span> Use My Current Location
                    </button>

                    <div className="relative z-20">
                        <input value={query} onChange={handleSearch} placeholder="Search area, street, city..." 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] focus:bg-white font-semibold text-sm transition-colors" />
                        
                        {suggestions.length > 0 && (
                            <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                {suggestions.map((s, i) => (
                                    <button key={i} onClick={() => selectSuggestion(s)} className="w-full text-left p-3 border-b border-gray-50 hover:bg-orange-50 last:border-0 text-xs font-semibold text-gray-700 truncate transition-colors">
                                        {s.display_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative z-0">
                        {showMap && (
                            <MapPopup
                                key={mapRenderKey}
                                position={position}
                                setPosition={setPosition}
                            />
                        )}
                        <div className="absolute top-3 left-3 right-3 bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-[10px] font-bold text-gray-500 shadow-sm pointer-events-none z-[1000] text-center border border-white/50">
                            Move around and tap the map to drop a pin
                        </div>
                    </div>

                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 shrink-0">
                        <p className="text-xs font-bold text-orange-800 mb-1">Selected Location:</p>
                        <p className="text-sm font-semibold text-[#1A1A2E] leading-snug">{loading ? 'Fetching precise address...' : addressText}</p>
                    </div>

                </div>

                <div className="p-5 border-t border-gray-50 bg-white shrink-0">
                    <button onClick={() => { onSelect(addressText, position); onClose() }} 
                        className="w-full bg-[#FF6B35] text-white py-4 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 active:scale-95 transition-transform hover:bg-[#E85A24]">
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    )
}
