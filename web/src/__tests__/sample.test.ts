import { describe, it, expect } from 'vitest';

describe('Phase 0 Sanity Check', () => {
  it('should pass basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const appName = '勇者の宿題帳';
    expect(appName).toContain('宿題');
  });

  it('should work with arrays', () => {
    const locales = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'ar', 'hi'];
    expect(locales).toHaveLength(10);
    expect(locales).toContain('ar');
  });
});
