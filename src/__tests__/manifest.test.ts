import manifest from '@/app/manifest';

describe('web app manifest', () => {
  const original = process.env.NEXT_PUBLIC_BASE_PATH;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    } else {
      process.env.NEXT_PUBLIC_BASE_PATH = original;
    }
  });

  it('is installable: standalone display with any + maskable icons at 192 and 512', () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    const m = manifest();

    expect(m.display).toBe('standalone');
    expect(m.theme_color).toBeTruthy();
    expect(m.background_color).toBeTruthy();

    const purposes = (m.icons ?? []).map((icon) => icon.purpose);
    expect(purposes).toContain('any');
    expect(purposes).toContain('maskable');

    const sizes = (m.icons ?? []).map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('uses root-absolute paths when no basePath is set (Vercel SSR)', () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    const m = manifest();

    expect(m.start_url).toBe('/');
    expect(m.scope).toBe('/');
    for (const icon of m.icons ?? []) {
      expect(icon.src.startsWith('/')).toBe(true);
      expect(icon.src.startsWith('/alpha-drums')).toBe(false);
    }
  });

  it('prefixes every URL with the basePath on the GitHub Pages export', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/alpha-drums';
    const m = manifest();

    expect(m.start_url).toBe('/alpha-drums/');
    expect(m.scope).toBe('/alpha-drums/');
    for (const icon of m.icons ?? []) {
      expect(icon.src.startsWith('/alpha-drums/')).toBe(true);
    }
  });
});
