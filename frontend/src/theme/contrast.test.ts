const css = (
  Object.values(import.meta.glob('../index.css', { query: '?raw', import: 'default', eager: true }))[0] as string
);

/**
 * Reads the real design tokens from index.css and checks them, so changing a
 * colour cannot silently break readability in either theme.
 */

type Tokens = Record<string, { rgb: [number, number, number]; hex: string }>;

function parseBlock(selector: string): Tokens {
  const start = css.indexOf(selector + ' {');
  if (start < 0) throw new Error(`no ${selector} block in index.css`);
  const body = css.slice(start, css.indexOf('}', start));
  const tokens: Tokens = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(\d+) (\d+) (\d+);\s*\/\*\s*(#[0-9A-Fa-f]{6})\s*\*\//g)) {
    tokens[m[1]] = {
      rgb: [Number(m[2]), Number(m[3]), Number(m[4])],
      hex: m[5].toUpperCase(),
    };
  }
  return tokens;
}

const luminance = ([r, g, b]: number[]) => {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [text token, background token] pairs that actually appear in the UI
const TEXT_PAIRS: [string, string][] = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['foreground', 'muted'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'muted'],
  ['brand', 'background'],
  ['brand', 'card'],
  ['brand-foreground', 'brand'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['success', 'background'],
  ['success', 'card'],
  ['warning', 'background'],
  ['warning', 'card'],
  ['destructive', 'background'],
  ['destructive', 'card'],
  ['destructive-foreground', 'destructive'],
  ['nav-foreground', 'nav'],
];

const REQUIRED = [
  'background', 'foreground', 'card', 'muted', 'muted-foreground', 'border', 'ring', 'brand',
  'brand-foreground', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'success', 'warning', 'destructive', 'destructive-foreground', 'nav', 'nav-foreground',
];

describe.each([
  ['light', ':root'],
  ['dark', '.dark'],
])('%s theme tokens', (_name, selector) => {
  const tokens = parseBlock(selector);

  it('defines every token the UI uses', () => {
    expect(Object.keys(tokens).sort()).toEqual(expect.arrayContaining(REQUIRED));
  });

  it('keeps the RGB channels in sync with the hex comment', () => {
    for (const [name, t] of Object.entries(tokens)) {
      const fromHex = [1, 3, 5].map((i) => parseInt(t.hex.slice(i, i + 2), 16));
      expect({ name, rgb: t.rgb }).toEqual({ name, rgb: fromHex });
    }
  });

  it.each(TEXT_PAIRS)('%s on %s meets WCAG AA (4.5:1)', (fg, bg) => {
    expect(contrast(tokens[fg].rgb, tokens[bg].rgb)).toBeGreaterThanOrEqual(4.5);
  });

  it('separates card and page with a visible border (3:1 against the page is not required, but it must differ)', () => {
    expect(tokens.border.hex).not.toBe(tokens.background.hex);
    expect(tokens.card.hex).not.toBe(tokens.background.hex);
  });
});

describe('palette identity', () => {
  it('uses forest green for structure and coral for the main action', () => {
    const light = parseBlock(':root');
    expect(light.brand.hex).toBe('#1F4D3A');
    expect(light.primary.hex).toBe('#F26B5B');
    expect(light.background.hex).toBe('#F7F1E3');
  });
});
