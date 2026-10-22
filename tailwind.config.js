/**
 * Colour tokens are RGB channels in src/styles/globals.css, so Tailwind can
 * compose an alpha for opacity modifiers: `bg-y-surface-soft/60` really emits
 * `rgb(var(--y-surface-soft-rgb) / 0.6)`.
 */
const channel = (token) => `rgb(var(--y-${token}-rgb) / <alpha-value>)`

/** Token that is translucent by design: keep its own default alpha when no
 *  `/opacity` modifier is passed, otherwise use the requested one.
 *  Without a modifier Tailwind hands the colour a `var(--tw-*-opacity)` handle,
 *  so only a plain number counts as an explicit alpha. */
const translucent = (token, alphaVariable) => ({ opacityValue }) => {
  const explicit = typeof opacityValue === 'string' && !opacityValue.startsWith('var(')
  const alpha = explicit ? opacityValue : `var(--y-${alphaVariable})`
  return `rgb(var(--y-${token}-rgb) / ${alpha})`
}

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
        'y-bg': channel('bg'),
        'y-bg-elevated': channel('bg-elevated'),
        'y-sidebar': channel('sidebar'),
        'y-surface': channel('surface'),
        'y-surface-soft': channel('surface-soft'),
        'y-surface-hover': channel('surface-hover'),
        'y-line': translucent('line', 'line-alpha'),
        'y-line-strong': translucent('line', 'line-strong-alpha'),
        'y-ink': channel('ink'),
        'y-ink-muted': channel('ink-muted'),
        'y-ink-dim': channel('ink-dim'),
        'y-accent': channel('accent'),
        'y-accent-hover': channel('accent-hover'),
        'y-accent-soft': translucent('accent', 'accent-soft-alpha'),
        'y-accent-border': translucent('accent', 'accent-border-alpha'),
        'y-success': channel('success'),
        'y-success-soft': translucent('success', 'success-soft-alpha'),
        'y-warn': channel('warn'),
        'y-warn-soft': translucent('warn', 'warn-soft-alpha'),
        'y-danger': channel('danger'),
        'y-danger-soft': translucent('danger', 'danger-soft-alpha'),
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
        /* Chat body copy sits at 15px (y-base) and the composer at 16px (y-md):
           the reading size a long Persian conversation needs. */
        'y-xs': ['12px', { lineHeight: '1.65' }],
        'y-sm': ['13px', { lineHeight: '1.75' }],
        'y-base': ['15px', { lineHeight: '1.85' }],
        'y-md': ['16px', { lineHeight: '1.85' }],
        'y-lg': ['18px', { lineHeight: '1.75' }],
        'y-xl': ['22px', { lineHeight: '1.6' }],
        'y-2xl': ['28px', { lineHeight: '1.45' }],
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
        /* Dialog entrance: scales in place. It must not translate, because the
           dialog is centred by its flex wrapper and a transform here would
           override that centring. */
        'y-dialog-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
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
        'y-dialog-in': 'y-dialog-in 180ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
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
