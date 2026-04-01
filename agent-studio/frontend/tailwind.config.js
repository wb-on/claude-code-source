/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        glass: '0 10px 30px rgba(0,0,0,0.25)',
      },
      colors: {
        panel: '#111827',
      },
    },
  },
  plugins: [],
};
