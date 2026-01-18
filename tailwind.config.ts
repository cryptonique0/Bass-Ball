import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        grass: '#2d5016',
        'pitch-line': '#ffffff',
        'goal-line': '#ffff00',
      },
      animation: {
        bounce: 'bounce 0.6s infinite',
      },
    },
  },
  plugins: [],
}
export default config
