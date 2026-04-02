/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#1e1f22',
          darker: '#111214',
          mid: '#2b2d31',
          light: '#313338',
          blurple: '#5865f2',
          blurpleHover: '#4752c4',
          green: '#57f287',
          red: '#ed4245',
          yellow: '#fee75c',
        },
      },
    },
  },
  plugins: [],
};
