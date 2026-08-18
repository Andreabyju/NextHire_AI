/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#050816',
        cardBg: '#0F172A',
        secBg: '#111827',
        blueAccent: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
        },
        violetAccent: {
          DEFAULT: '#7C3AED',
          light: '#8B5CF6',
        },
        textGray: '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(37, 99, 235, 0.4)',
        'glow-violet': '0 0 15px rgba(124, 58, 237, 0.4)',
        'glow-mixed': '0 0 20px rgba(139, 92, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.3)',
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
