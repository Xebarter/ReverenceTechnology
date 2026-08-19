import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Source Sans 3', 'sans-serif'],
        serif: ['var(--font-serif)', 'Newsreader', 'serif'],
        admin: ['var(--font-admin)', 'Nunito Sans', 'sans-serif'],
      },
      colors: {
        paper: '#F4F1EA',
        'paper-2': '#EBE6DC',
        surface: '#FFFCF7',
        ink: '#1C3D5A',
        'ink-deep': '#0E2436',
        muted: '#5E6D7A',
        rule: '#DDD6C8',
        gold: '#B08D57',
      },
      boxShadow: {
        hairline: '0 1px 0 0 rgb(221 214 200 / 0.9)',
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
      maxWidth: {
        '6xl': '72rem',
      },
      typography: ({ theme }) => ({
        editorial: {
          css: {
            '--tw-prose-body': theme('colors.muted'),
            '--tw-prose-headings': theme('colors.ink-deep'),
            '--tw-prose-lead': theme('colors.ink'),
            '--tw-prose-links': theme('colors.ink'),
            '--tw-prose-bold': theme('colors.ink-deep'),
            '--tw-prose-counters': theme('colors.gold'),
            '--tw-prose-bullets': theme('colors.gold'),
            '--tw-prose-hr': theme('colors.rule'),
            '--tw-prose-quotes': theme('colors.ink-deep'),
            '--tw-prose-quote-borders': theme('colors.gold'),
            '--tw-prose-captions': theme('colors.muted'),
            '--tw-prose-code': theme('colors.ink'),
            '--tw-prose-pre-code': theme('colors.paper'),
            '--tw-prose-pre-bg': theme('colors.ink-deep'),
            '--tw-prose-th-borders': theme('colors.rule'),
            '--tw-prose-td-borders': theme('colors.rule'),
            maxWidth: 'none',
            fontFamily: theme('fontFamily.sans').join(', '),
            'h1, h2, h3, h4': {
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '500',
            },
            a: {
              textDecoration: 'underline',
              textDecorationColor: theme('colors.gold'),
              textUnderlineOffset: '3px',
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
