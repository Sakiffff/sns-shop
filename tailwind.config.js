/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        forest: {
          50: '#f0f7f0', 100: '#dceede', 200: '#bcdebf', 300: '#8ec794',
          400: '#5ea867', 500: '#3d8c47', 600: '#2e7036', 700: '#265a2d',
          800: '#214826', 900: '#1c3b21', 950: '#0e2112',
        },
        sand: {
          50: '#faf8f3', 100: '#f4f0e4', 200: '#e8dfc8', 300: '#d9c9a3',
          400: '#c8af7a', 500: '#ba9a5a', 600: '#a8844d', 700: '#8c6b40',
          800: '#725638', 900: '#5e4630',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
}