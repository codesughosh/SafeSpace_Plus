/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:    '#6C63FF',
        secondary:  '#48CAE4',
        accent:     '#F7B731',
        success:    '#26de81',
        warning:    '#FFA500',
        danger:     '#FC5C65',
        background: '#0F0F1A',
        surface:    '#1A1A2E',
        card:       '#16213E',
        'text-primary': '#E2E8F0',
        muted:      '#94A3B8',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':         'float 6s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'gradient-x':    'gradient-x 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'gradient-x': {
          '0%,100%': { backgroundSize: '200% 200%', backgroundPosition: 'left center' },
          '50%':     { backgroundSize: '200% 200%', backgroundPosition: 'right center' },
        },
      },
      boxShadow: {
        'glow-primary':   '0 0 30px rgba(108,99,255,0.3)',
        'glow-secondary': '0 0 30px rgba(72,202,228,0.3)',
        'glow-danger':    '0 0 20px rgba(252,92,101,0.4)',
        'card':           '0 4px 24px rgba(0,0,0,0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
