/**
 * Channel-form colour tokens.
 *
 * Tailwind 3 can only emit an opacity modifier (`bg-y-surface/60`) when the
 * colour value is expressed as a function with an `<alpha-value>` slot — a bare
 * `var(--y-surface)` silently drops the utility. The tokens therefore live in
 * `src/styles/globals.css` as space-separated RGB channels, and the helpers
 * below put them back together:
 *
 *   solid('surface')          -> rgb(var(--y-surface) / <alpha-value>)
 *   tinted('line-strong')     -> rgb(var(--y-line-strong) / calc(<alpha-value> * var(--y-line-strong-a)))
 *
 * `tinted` is for tokens whose design default is translucent (hairlines, soft
 * status washes): the base alpha lives in its own `-a` variable, so
 * `border-y-line` stays a hairline while `border-y-line/50` is half of it.
 */
const solid = (name) => `rgb(var(--y-${name}) / <alpha-value>)`
const tinted = (name) => `rgb(var(--y-${name}) / calc(<alpha-value> * var(--y-${name}-a)))`

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Preflight resets are intentionally disabled: YAgent must be embeddable inside
  // WordPress admin pages without restyling the host. The equivalent, scoped reset
  // lives in the base layer of src/styles/globals.css.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // surfaces — three quiet levels: app, elevated panel, control surface
        'y-bg': solid('bg'),
        'y-bg-elevated': solid('bg-elevated'),
        'y-sidebar': solid('sidebar'),
        'y-surface': solid('surface'),
        'y-surface-soft': solid('surface-soft'),
        'y-surface-hover': solid('surface-hover'),

        // hairlines
        'y-line': tinted('line'),
        'y-line-strong': tinted('line-strong'),

        // type
        'y-ink': solid('ink'),
        'y-ink-muted': solid('ink-muted'),
        'y-ink-dim': solid('ink-dim'),

        // one restrained accent
        'y-accent': solid('accent'),
        'y-accent-hover': solid('accent-hover'),
        'y-accent-strong': solid('accent-strong'),
        'y-accent-strong-hover': solid('accent-strong-hover'),
        'y-accent-soft': tinted('accent-soft'),
        'y-accent-border': tinted('accent-border'),

        // semantic status colours — used only to carry meaning
        'y-success': solid('success'),
        'y-success-soft': tinted('success-soft'),
        'y-warn': solid('warn'),
        'y-warn-soft': tinted('warn-soft'),
        'y-danger': solid('danger'),
        'y-danger-soft': tinted('danger-soft'),
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
      // Reading sizes are in px on purpose: the product must look identical inside
      // the WordPress admin, whose own font size varies per theme.
      fontSize: {
        'y-xs': ['12px', { lineHeight: '1.7' }],
        'y-sm': ['13px', { lineHeight: '1.75' }],
        'y-base': ['14px', { lineHeight: '1.85' }],
        'y-md': ['15.5px', { lineHeight: '1.95' }],
        'y-lg': ['17.5px', { lineHeight: '1.8' }],
        'y-xl': ['21px', { lineHeight: '1.6' }],
        'y-2xl': ['27px', { lineHeight: '1.45' }],
      },
      borderRadius: {
        'y-xs': 'var(--y-radius-xs)',
        'y-sm': 'var(--y-radius-sm)',
        'y-md': 'var(--y-radius-md)',
        'y-lg': 'var(--y-radius-lg)',
        'y-xl': 'var(--y-radius-xl)',
        'y-2xl': 'var(--y-radius-2xl)',
      },
      opacity: {
        // `disabled:opacity-45` is used across the UI; the default scale has no 45.
        45: '0.45',
      },
      boxShadow: {
        'y-soft': 'var(--y-shadow-soft)',
        'y-pop': 'var(--y-shadow-pop)',
      },
      transitionDuration: {
        'y-fast': '150ms',
        y: '190ms',
        'y-slow': '220ms',
      },
      transitionTimingFunction: {
        y: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
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
        'y-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.15' },
        },
      },
      animation: {
        'y-fade-in': 'y-fade-in 190ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'y-rise': 'y-rise 200ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'y-pop': 'y-pop 220ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        // Only the streaming caret blinks, and it stops on its own: no perpetual
        // glow or shimmer anywhere in the interface.
        'y-blink': 'y-blink 1s steps(1, end) infinite',
      },
    },
  },
  plugins: [],
}
