import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

/**
 * Integritätstest für die Übersetzungen in `packages/i18n`.
 *
 * Verhindert das stille Auseinanderdriften der mittlerweile 31 Sprachen:
 * jede Locale muss exakt dieselben Schlüssel und Platzhalter wie die
 * Referenz (`de.json`) besitzen, und die Locale-Dateien müssen 1:1 zu
 * `SUPPORTED_LOCALES` in `src/index.ts` passen. So fällt ein vergessener
 * Schlüssel oder eine kaputte `{{interpolation}}` sofort im CI auf.
 */

const I18N_SRC = resolve(__dirname, '../../../../packages/i18n/src');
const LOCALES_DIR = resolve(I18N_SRC, 'locales');
const REFERENCE = 'de';

const indexSrc = readFileSync(resolve(I18N_SRC, 'index.ts'), 'utf8');

/** Liest ein `const NAME: ... = [ 'a', 'b' ]` aus index.ts als String-Array. */
function parseLocaleArray(name: string): string[] {
  const match = indexSrc.match(new RegExp(`${name}[^=]*=\\s*\\[([^\\]]*)\\]`));
  if (!match) throw new Error(`Konnte ${name} nicht aus index.ts parsen`);
  // 2–3 Buchstaben: 2-stellige ISO-639-1-Codes plus 3-stellige (z. B. kurdische
  // Varietäten kmr/ckb/sdh/zza/hac).
  return [...match[1].matchAll(/'([a-z]{2,3})'/g)].map((m) => m[1]);
}

const SUPPORTED_LOCALES = parseLocaleArray('SUPPORTED_LOCALES');
const RTL_LOCALES = parseLocaleArray('RTL_LOCALES');

type Tree = { [key: string]: string | Tree };

function loadLocale(code: string): Tree {
  return JSON.parse(readFileSync(resolve(LOCALES_DIR, `${code}.json`), 'utf8')) as Tree;
}

/** Alle Blatt-Schlüsselpfade (z. B. `landing.hero_title`), sortiert. */
function leafPaths(tree: Tree, prefix = ''): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') out.push(...leafPaths(value, path));
    else out.push(path);
  }
  return out.sort();
}

/** Wert an einem Punkt-getrennten Pfad. */
function valueAt(tree: Tree, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => (acc as Tree)?.[k], tree);
}

/** Sortierte Menge der `{{platzhalter}}` in einem String. */
function placeholders(value: string): string[] {
  return [...value.matchAll(/{{\s*([\w]+)\s*}}/g)].map((m) => m[1]).sort();
}

const jsonFiles = readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort();

const reference = loadLocale(REFERENCE);
const referencePaths = leafPaths(reference);

describe('i18n: SUPPORTED_LOCALES ↔ Locale-Dateien', () => {
  it('parst SUPPORTED_LOCALES und RTL_LOCALES aus index.ts', () => {
    expect(SUPPORTED_LOCALES.length).toBeGreaterThanOrEqual(31);
    expect(RTL_LOCALES).toEqual(expect.arrayContaining(['ar', 'he']));
  });

  it('hat für jede SUPPORTED_LOCALE genau eine Locale-Datei (und keine Waisen)', () => {
    expect(jsonFiles).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it('RTL_LOCALES sind eine Teilmenge von SUPPORTED_LOCALES', () => {
    for (const code of RTL_LOCALES) expect(SUPPORTED_LOCALES).toContain(code);
  });

  it('Referenz-Locale (de) ist nicht leer', () => {
    expect(referencePaths.length).toBeGreaterThan(100);
  });
});

describe('i18n: jede Locale ist deckungsgleich zur Referenz (de)', () => {
  const others = SUPPORTED_LOCALES.filter((c) => c !== REFERENCE);

  it.each(others)('%s: identische Schlüsselmenge wie de.json', (code) => {
    const paths = leafPaths(loadLocale(code));
    const missing = referencePaths.filter((p) => !paths.includes(p));
    const extra = paths.filter((p) => !referencePaths.includes(p));
    expect({ code, missing, extra }).toEqual({ code, missing: [], extra: [] });
  });

  it.each(others)('%s: identische {{platzhalter}} je Schlüssel', (code) => {
    const tree = loadLocale(code);
    const mismatches: Record<string, { de: string[]; loc: string[] }> = {};
    for (const path of referencePaths) {
      const refVal = valueAt(reference, path);
      const locVal = valueAt(tree, path);
      if (typeof refVal !== 'string' || typeof locVal !== 'string') continue;
      const refPh = placeholders(refVal);
      const locPh = placeholders(locVal);
      if (refPh.join(',') !== locPh.join(',')) mismatches[path] = { de: refPh, loc: locPh };
    }
    expect(mismatches).toEqual({});
  });
});
