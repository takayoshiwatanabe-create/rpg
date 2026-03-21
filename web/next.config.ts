import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Explicitly declare this project's root to prevent Next.js 15 from
  // mis-detecting a parent lockfile as the monorepo workspace root.
  outputFileTracingRoot: path.join(__dirname, '../'),
};

export default withNextIntl(nextConfig);
