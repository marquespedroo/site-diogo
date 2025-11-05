/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./public/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Exact colors from Figma design
        army: '#395917',
        white: '#FFFFFF',
        black: {
          200: '#201F23',
          300: '#000000',
        },
        'soft-green': {
          100: '#E6EFEA',
          200: '#A4C8AE',
        },
        'dark-green': {
          200: '#617C6C',
          300: '#4C6C5A',
        },
        grey: {
          200: '#596269',
          300: '#45515C',
        },
        purple: {
          100: '#E3E4EA',
          200: '#B8BED5',
          300: '#595D75',
        },
        red: '#98140B',
        beige: {
          200: '#E5D6B8',
          300: '#A39170',
        },
        tosca: '#C1D8DA',
        background: '#EAE9E3',
      },
      fontFamily: {
        sans: ['General Sans', 'Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '24': '24.156px',
        '27': '27px',
        '54': '54px',
        '60': '60.389px',
        '75': '75.486px',
        '100': '100px',
        '180': '180px',
      },
      boxShadow: {
        'dashboard': '-47.556px -23.401px 153.992px 0px rgba(0,0,0,0.07)',
        'info': '0px 15.097px 18.872px -5px rgba(69,81,92,0.1), 0px 6.039px 7.549px -6px rgba(69,81,92,0.1)',
        'avatar': '0px 1.661px 8.802px 0px rgba(230,191,159,0.3)',
      },
    },
  },
  plugins: [],
}
