import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./1778216906433156519.html"
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				cinzel: ['Cinzel', 'serif'],
				cormorant: ['Cormorant Garamond', 'serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				gold: {
					light: '#f0d080',
					DEFAULT: '#c8a84b',
					dark: '#8b6914',
				},
				shadow: {
					purple: '#6b21a8',
					deep: '#0d0618',
					mid: '#1a0a2e',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.9)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-8px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 10px rgba(168,85,247,0.4)' },
					'50%': { boxShadow: '0 0 30px rgba(168,85,247,0.9), 0 0 60px rgba(168,85,247,0.4)' }
				},
				'gold-glow': {
					'0%, 100%': { boxShadow: '0 0 10px rgba(200,168,75,0.4)' },
					'50%': { boxShadow: '0 0 30px rgba(200,168,75,0.9), 0 0 60px rgba(200,168,75,0.4)' }
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'20%': { transform: 'translateX(-8px)' },
					'40%': { transform: 'translateX(8px)' },
					'60%': { transform: 'translateX(-5px)' },
					'80%': { transform: 'translateX(5px)' }
				},
				'damage-float': {
					'0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
					'100%': { opacity: '0', transform: 'translateY(-60px) scale(1.3)' }
				},
				'magic-burst': {
					'0%': { transform: 'scale(0)', opacity: '1' },
					'100%': { transform: 'scale(3)', opacity: '0' }
				},
				'slide-in-right': {
					from: { opacity: '0', transform: 'translateX(30px)' },
					to: { opacity: '1', transform: 'translateX(0)' }
				},
				'rune-spin': {
					from: { transform: 'rotate(0deg)' },
					to: { transform: 'rotate(360deg)' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out forwards',
				'scale-in': 'scale-in 0.3s ease-out forwards',
				'float': 'float 3s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'gold-glow': 'gold-glow 2s ease-in-out infinite',
				'shake': 'shake 0.4s ease-in-out',
				'damage-float': 'damage-float 1s ease-out forwards',
				'magic-burst': 'magic-burst 0.5s ease-out forwards',
				'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
				'rune-spin': 'rune-spin 8s linear infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
