/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    safelist: [
        'from-orange-500', 'to-red-500',
        'from-blue-500', 'to-cyan-500',
        'from-emerald-500', 'to-teal-500',
        'from-purple-500', 'to-pink-500',
        'from-gray-800', 'to-black'
    ],
    theme: {
        extend: {
            colors: {
                primary: '#FF6B35',
                'primary-dark': '#E85A24',
                secondary: '#1A1A2E',
                accent: '#16C79A',
                background: '#F8F9FA',
                surface: '#FFFFFF',
                muted: '#6B7280',
                border: '#E5E7EB',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'slide-up': 'slideUp 0.3s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'pulse-slow': 'pulse 3s infinite',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
