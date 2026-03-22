/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ag: {
          base: '#0B0E1A',
          surface: '#12172B',
          elevated: '#1A2040',
          teal: '#00E5C3',
          violet: '#7B61FF',
          danger: '#FF3D5A',
          warning: '#FFB830',
          'text-primary': '#F0F2FF',
          'text-secondary': '#8892B0',
          'text-muted': '#4A5480',
        }
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out both',
        'slide-left': 'slideLeft 0.25s ease-out both',
        'slide-right': 'slideRight 0.25s ease-out both',
        shimmer: 'shimmer 1.5s infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,229,195,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0,229,195,0.4)' },
        },
      },
    },
  },
  plugins: [],
}