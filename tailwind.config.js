/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Preflight resets are intentionally disabled: YAgent must be embeddable inside
  // WordPress admin pages without restyling the host. The equivalent, scoped reset
  // lives in src/styles/globals.css under `.yagent-root`.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        'y-bg': 'var(--y-bg)',
        'y-bg-elevated': 'var(--y-bg-elevated)',
        'y-sidebar': 'var(--y-sidebar)',
        'y-surface': 'var(--y-surface)',
        'y-surface-soft': 'var(--y-surface-soft)',
        'y-surface-hover': 'var(--y-surface-hover)',
        'y-line': 'var(--y-border)',
        'y-line-strong': 'var(--y-border-strong)',
        'y-ink': 'var(--y-text)',
        'y-ink-muted': 'var(--y-text-muted)',
        'y-ink-dim': 'var(--y-text-dim)',
        'y-accent': 'var(--y-accent)',
        'y-accent-hover': 'var(--y-accent-hover)',
        'y-accent-soft': 'var(--y-accent-soft)',
        'y-accent-border': 'var(--y-accent-border)',
        'y-success': 'var(--y-success)',
        'y-success-soft': 'var(--y-success-soft)',
        'y-warn': 'var(--y-warn)',
        'y-warn-soft': 'var(--y-warn-soft)',
        'y-danger': 'var(--y-danger)',
        'y-danger-soft': 'var(--y-danger-soft)',
      },
      fontFamily: {
        sans: [
          'Vazirmatn Variable',
          'Vazirmatn',
          'Segoe UI',
          'Tahoma',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      fontSize: {
        'y-xs': ['11.5px', { lineHeight: '1.6' }],
        'y-sm': ['12.5px', { lineHeight: '1.7' }],
        'y-base': ['13.5px', { lineHeight: '1.8' }],
        'y-md': ['14.5px', { lineHeight: '1.85' }],
        'y-lg': ['16px', { lineHeight: '1.8' }],
        'y-xl': ['20px', { lineHeight: '1.6' }],
        'y-2xl': ['26px', { lineHeight: '1.45' }],
      },
      borderRadius: {
        'y-xs': 'var(--y-radius-xs)',
        'y-sm': 'var(--y-radius-sm)',
        'y-md': 'var(--y-radius-md)',
        'y-lg': 'var(--y-radius-lg)',
        'y-xl': 'var(--y-radius-xl)',
        'y-2xl': 'var(--y-radius-2xl)',
      },
      boxShadow: {
        'y-soft': 'var(--y-shadow-soft)',
        'y-pop': 'var(--y-shadow-pop)',
      },
      transitionDuration: {
        'y-fast': '150ms',
        'y': '190ms',
        'y-slow': '220ms',
      },
      transitionTimingFunction: {
        'y': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      keyframes: {
        'y-fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'y-rise': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'y-pop': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '60%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'y-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.55' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'y-shimmer': {
          '100%': { transform: 'translateX(-200%)' },
        },
        'y-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.15' },
        },
      },
      animation: {
        'y-fade-in': 'y-fade-in 190ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'y-rise': 'y-rise 200ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'y-pop': 'y-pop 220ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'y-ring': 'y-ring 1.6s cubic-bezier(0.22, 0.61, 0.36, 1) infinite',
        'y-shimmer': 'y-shimmer 1.6s linear infinite',
        'y-blink': 'y-blink 1s steps(1, end) infinite',
        'y-spin-slow': 'spin 1.4s linear infinite',
      },
    },
  },
  plugins: [],
}
