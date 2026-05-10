/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#FF6B35',
                'primary-dark': '#E85A24',
                secondary: '#1A1A2E',
                accent: '#16C79A',
                background: '#F8F9FA',
                muted: '#6B7280',
                border: '#E5E7EB',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
