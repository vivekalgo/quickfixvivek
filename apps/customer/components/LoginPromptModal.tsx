'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface LoginPromptModalProps {
    isOpen: boolean
    onClose: () => void
    /** Where to redirect after login (default: current page) */
    redirectAfter?: string
}

export default function LoginPromptModal({ isOpen, onClose, redirectAfter }: LoginPromptModalProps) {
    const router = useRouter()

    // Lock body scroll when modal is open (style.overflow avoids className hydration mismatch)
    useEffect(() => {
        if (typeof document === 'undefined') return
        const prev = document.body.style.overflow
        if (isOpen) document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [isOpen])

    if (!isOpen) return null

    const handleLogin = () => {
        const returnTo = redirectAfter || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')
        router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`)
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                style={{ animation: 'lpm-fadeIn 0.2s ease' }}
            />

            {/* Bottom Sheet */}
            <div
                className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[70] w-full max-w-[430px]"
                style={{ animation: 'lpm-slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                <div className="bg-white rounded-t-3xl px-6 pt-4 pb-10 shadow-2xl">
                    {/* Drag handle */}
                    <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                        <div
                            className="w-20 h-20 rounded-3xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #FF6B35, #E85A24)' }}
                        >
                            <span className="text-4xl">🔐</span>
                        </div>
                    </div>

                    {/* Text */}
                    <h2 className="text-[#1A1A2E] font-black text-2xl text-center mb-2">
                        Login to Book
                    </h2>
                    <p className="text-gray-500 text-sm text-center mb-7 leading-relaxed">
                        Create a free account or sign in to<br />
                        book this service instantly.
                    </p>

                    {/* Benefits */}
                    <div className="flex gap-3 justify-center mb-7">
                        {[
                            { icon: '⚡', text: 'Instant Booking' },
                            { icon: '📍', text: 'Track Orders' },
                            { icon: '🔔', text: 'Live Updates' },
                        ].map(b => (
                            <div key={b.text} className="flex flex-col items-center gap-1.5 bg-orange-50 rounded-2xl px-3 py-3 flex-1">
                                <span className="text-xl">{b.icon}</span>
                                <span className="text-[10px] font-semibold text-orange-700 text-center leading-tight">{b.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={handleLogin}
                        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 mb-3"
                        style={{ background: 'linear-gradient(135deg, #FF6B35, #E85A24)' }}
                    >
                        Login / Sign Up →
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl font-semibold text-gray-500 text-sm hover:bg-gray-50 transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes lpm-fadeIn {
                    from { opacity: 0 }
                    to   { opacity: 1 }
                }
                @keyframes lpm-slideUp {
                    from { transform: translate(-50%, 100%) }
                    to   { transform: translate(-50%, 0) }
                }
            `}</style>
        </>
    )
}
