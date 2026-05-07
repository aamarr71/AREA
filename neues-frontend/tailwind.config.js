/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Manrope', 'Verdana', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      maxWidth: {
        reading: '720px',
        editorial: '1100px',
        shell: '1280px',
      },
      colors: {
        area: {
          ink: '#0F1419',
          paper: '#F5F1EB',
          text: '#1A1F25',
          muted: '#6B7280',
          red: '#E63946',
          amber: '#F4A261',
          teal: '#2A9D8F',
        },
      },
      boxShadow: {
        hair: '0 1px 2px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
