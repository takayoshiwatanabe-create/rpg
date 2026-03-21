import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });

  return {
    title: t('name'),
    description: t('tagline'),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-pixel)' }}>
          ⚔️ {t('name')}
        </h1>
        <p className="text-xl mb-8" style={{ color: 'var(--color-rpg-text-dim)' }}>
          {t('tagline')}
        </p>
        <nav className="flex gap-4 justify-center flex-wrap">
          {(['quests', 'battle', 'records'] as const).map((key) => (
            <a
              key={key}
              href={`/${locale}/${key}`}
              className="px-4 py-2 border-2 border-current hover:opacity-80 transition-opacity"
              style={{
                borderColor: 'var(--color-rpg-primary)',
                color: 'var(--color-rpg-primary)',
              }}
            >
              {tNav(key)}
            </a>
          ))}
        </nav>
      </div>
    </main>
  );
}
