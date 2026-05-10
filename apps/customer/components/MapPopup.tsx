'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon issue with Next.js/Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

export default function MapPopup({ position, setPosition }: { position: [number, number], setPosition: (p: [number, number]) => void }) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const markerRef = useRef<L.Marker | null>(null)

    // Initialize map
    useEffect(() => {
        if (!mapRef.current) return

        // Prevent multiple initializations in Strict Mode
        if (!mapInstanceRef.current) {
            const map = L.map(mapRef.current).setView(position, 13)
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map)

            const marker = L.marker(position, { icon }).addTo(map)
            markerRef.current = marker

            map.on('click', (e) => {
                setPosition([e.latlng.lat, e.latlng.lng])
            })

            mapInstanceRef.current = map
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Init once

    // Update map when position changes from outside (e.g. search)
    useEffect(() => {
        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView(position)
            markerRef.current.setLatLng(position)
        }
    }, [position])

    return <div ref={mapRef} style={{ height: '250px', width: '100%', zIndex: 0 }} />
}
