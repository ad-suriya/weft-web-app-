import type { Config } from 'tailwindcss';

// Token values kept in sync by hand with dashboard/frontend/src/index.css's
// @theme block — the two apps are on different Tailwind majors (this one's
// v3/JS-config, the dashboard's v4/CSS-@theme) so there's no single file
// either can literally import; the *names* below (ink/paper/planning/panic/
// review) stay as-is since they're used throughout pages/popup's JSX, only
// the hex values changed, to bring the extension popup onto the dashboard's
// soft-modern/editorial identity instead of its earlier neobrutalist fork.
export default {
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: [
          '"Inter"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        ink: '#23271F', // dashboard --color-text-primary
        paper: '#F1F3EF', // dashboard --color-background
        planning: '#2F7A64', // dashboard --color-accent
        panic: '#C2632F', // dashboard --color-danger
        review: '#6E64C4', // dashboard --color-info
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        lg: '14px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(35, 39, 31, 0.06)',
        popover: '0 16px 40px -14px rgba(35, 39, 31, 0.24)',
      },
    },
  },
  plugins: [],
} as Omit<Config, 'content'>;
