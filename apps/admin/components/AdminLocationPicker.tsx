'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the map to avoid SSR issues
const MapPopup = dynamic(() => import('./MapPopup'), { 
    ssr: false, 
    loading: () => <div className="h-[300px] w-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center font-bold text-gray-400">Loading Map...</div> 
})

export default function AdminLocationPicker({ isOpen, onClose, onSelect }: any) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<any[]>([])
    // Default Bangalore
    const [position, setPosition] = useState<[number, number]>([12.9716, 77.5946])
    const [addressText, setAddressText] = useState('Bangalore, Karnataka')
    const [loading, setLoading] = useState(false)
    const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null)

    // Reverse Geocode when position changes from Map click
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
        fetchAddress()
    }, [position])

    // Forward Geocode for Search & Coordinate Parsing
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setQuery(val)
        if (typingTimer) clearTimeout(typingTimer)
        
        // 1. Direct Lat/Lng Pasting (e.g. 12.9716, 77.5946)
        const coordMatch = val.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/)
        if (coordMatch) {
            setPosition([parseFloat(coordMatch[1]), parseFloat(coordMatch[2])])
            setSuggestions([{ display_name: 'Pasted Coordinates', lat: coordMatch[1], lon: coordMatch[2] }])
            return
        }

        // 2. Google Maps URL Parsing (e.g. .../@12.9716,77.5946... or ...q=12.9716,77.5946)
        const gmMatch = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || val.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/)
        if (gmMatch) {
            setPosition([parseFloat(gmMatch[1]), parseFloat(gmMatch[2])])
            setSuggestions([{ display_name: 'Google Maps Link Coordinates', lat: gmMatch[1], lon: gmMatch[2] }])
            return
        }

        if (!val.trim()) {
            setSuggestions([])
            return
        }
        
        setTypingTimer(setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&countrycodes=in`)
                const data = await res.json()
                setSuggestions(data)
            } catch (err) {}
        }, 500))
    }

    const useCurrentLocation = () => {
        setLoading(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => { setPosition([pos.coords.latitude, pos.coords.longitude]); setLoading(false); setQuery('') },
            (err) => { alert('Please enable GPS permissions.'); setLoading(false) },
            { enableHighAccuracy: true }
        )
    }

    const selectSuggestion = (s: any) => {
        setPosition([parseFloat(s.lat), parseFloat(s.lon)])
        setQuery('')
        setSuggestions([])
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg mx-auto rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-scale-up">
                
                <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h2 className="font-black text-lg text-[#1A1A2E]">Drop Shop PIN</h2>
                    <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold hover:bg-gray-200">✕</button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    <p className="text-sm text-gray-500 font-medium">Search area, paste exact Lat/Lng coordinates, or paste a Google Maps link.</p>
                    
                    <div className="flex gap-2 relative z-20">
                        <input value={query} onChange={handleSearch} placeholder="Search, paste 12.97, 77.59 or Google Maps URL..." 
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] focus:bg-white font-semibold text-sm transition-colors" />
                        <button onClick={useCurrentLocation} title="Use My Device Location" className="bg-[#1A1A2E] text-white px-4 rounded-xl font-bold flex items-center justify-center hover:bg-gray-800 transition-colors">
                            📍
                        </button>

                        
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

                    <div className="relative rounded-2xl overflow-hidden shadow-inner border border-gray-200 z-0">
                        <MapPopup position={position} setPosition={setPosition} />
                        <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-[10px] font-bold text-[#FF6B35] shadow-sm pointer-events-none z-[1000] text-center border border-orange-100">
                            You can drag to map around and tap to drop the red pin exactly on the shop building.
                        </div>
                    </div>

                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 shrink-0">
                        <p className="text-xs font-bold text-orange-800 mb-1">Geocoded Address:</p>
                        <p className="text-sm font-semibold text-[#1A1A2E] leading-snug">{loading ? 'Geocoding PIN...' : addressText}</p>
                        <p className="text-[10px] font-mono text-gray-500 mt-2">LAT: {position[0].toFixed(6)} | LNG: {position[1].toFixed(6)}</p>
                    </div>

                </div>

                <div className="p-4 border-t border-gray-50 bg-white shrink-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => { onSelect(position[0], position[1], addressText); onClose() }} 
                        className="flex-[2] bg-[#FF6B35] text-white py-3.5 rounded-xl font-black text-sm shadow-lg shadow-orange-500/20 active:scale-95 transition-transform hover:bg-[#E85A24]">
                        Set Coordinates
                    </button>
                </div>
            </div>
        </div>
    )
}
