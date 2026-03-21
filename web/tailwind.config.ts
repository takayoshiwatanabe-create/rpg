import type { Config } from 'tailwindcss';

// Tailwind CSS v4: core configuration lives in src/app/globals.css via @theme blocks.
// This file handles advanced plugin registration and IDE type support.
const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        // Pixel font for 8-16bit RPG design system — loaded via globals.css @theme
        pixel: ['var(--font-pixel)', 'monospace'],
      },
    },
  },
};

export default config;
