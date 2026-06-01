#!/usr/bin/env node
/**
 * Statistik-Report-Generator für klopilot.ch
 * --------------------------------------------------------------------------
 * Erzeugt das zweisprachige (DE/EN) Statistik-Dokument unter
 * `apps/web/public/reports/` — Logo, Kennzahlen, Toiletten nach Rubriken und
 * nach Ländern sowie Impressum/Datenquellen — als HTML + PDF.
 *
 * Datenquelle: standardmässig die Prod-Datenbank über SSH
 *   (`sudo docker exec <pg-container> psql …`), konfigurierbar per Env.
 * Da das Datenmodell kein Länderfeld hat, wird das Land geografisch aus den
 * Koordinaten abgeleitet (kleinste enthaltende Bounding-Box → Enklaven korrekt).
 *
 * Aufruf:
 *   pnpm --filter web report                 # frische Prod-Zahlen ziehen
 *   pnpm --filter web report -- --no-pdf     # nur HTML + JSON
 *   pnpm --filter web report -- --from-json apps/web/public/reports/klopilot-stats.json
 *
 * Env (mit Defaults):
 *   REPORT_SSH_HOST=klopilot-vps  REPORT_PG_CONTAINER=klopilot-postgres
 *   REPORT_PG_USER=klopilot       REPORT_PG_DB=klopilot
 *   REPORT_DATE=<heute>           (YYYY-MM-DD, erscheint im Dokument)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import pw from '@playwright/test';

const { chromium } = pw;
const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(__dirname, '..');
const OUT = resolve(WEB, 'public', 'reports');

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const env = (k, d) => process.env[k] || d;

const SSH_HOST = env('REPORT_SSH_HOST', 'klopilot-vps');
const PG_CONTAINER = env('REPORT_PG_CONTAINER', 'klopilot-postgres');
const PG_USER = env('REPORT_PG_USER', 'klopilot');
const PG_DB = env('REPORT_PG_DB', 'klopilot');
const DATE = env('REPORT_DATE', new Date().toISOString().slice(0, 10));
const FROM_JSON = opt('--from-json', null);
const NO_PDF = has('--no-pdf');

// ── Land → Bounding-Box(en) [latMin, latMax, lngMin, lngMax] ────────────────
// Mehrere Boxen pro Land erlaubt (Festland + Inseln/Überseegebiete).
const BOXES = [
  ['CH', 'Schweiz', 45.8, 47.8, 5.9, 10.5],
  ['AT', 'Österreich', 46.4, 49.1, 9.5, 17.2],
  ['DE', 'Deutschland', 47.27, 55.1, 5.8, 15.1],
  ['FR', 'Frankreich', 41.3, 51.1, -5.2, 8.3],
  ['FR', 'Frankreich', 41.3, 43.1, 8.5, 9.6],
  ['IT', 'Italien', 36.6, 47.1, 6.6, 18.6],
  ['LU', 'Luxemburg', 49.4, 50.2, 5.7, 6.55],
  ['BE', 'Belgien', 49.5, 51.55, 2.5, 6.4],
  ['NL', 'Niederlande', 50.75, 53.7, 3.3, 7.3],
  ['PT', 'Portugal', 36.8, 42.2, -9.6, -6.2],
  ['PT', 'Portugal', 32.6, 33.2, -17.3, -16.2],
  ['PT', 'Portugal', 36.9, 39.9, -31.3, -24.8],
  ['ES', 'Spanien', 36.0, 43.9, -9.5, 3.4],
  ['ES', 'Spanien', 27.6, 29.5, -18.2, -13.3],
  ['DK', 'Dänemark', 54.5, 57.9, 8.0, 15.3],
  ['DK', 'Dänemark', 61.3, 62.4, -7.7, -6.3],
  ['SE', 'Schweden', 55.3, 69.1, 10.5, 24.2],
  ['NO', 'Norwegen', 57.9, 71.3, 4.0, 31.5],
  ['FI', 'Finnland', 59.5, 70.5, 19.5, 31.6],
  ['GB', 'Vereinigtes Königreich', 49.9, 60.9, -8.2, 1.9],
  ['IE', 'Irland', 51.4, 55.5, -10.6, -5.95],
  ['IS', 'Island', 63.2, 66.6, -24.6, -13.3],
  ['MT', 'Malta', 35.7, 36.1, 14.1, 14.7],
  ['CY', 'Zypern', 34.5, 35.8, 32.2, 34.65],
  ['GR', 'Griechenland', 34.7, 41.8, 19.4, 28.3],
  ['PL', 'Polen', 49.05, 54.9, 14.15, 24.2],
  ['CZ', 'Tschechien', 48.55, 51.06, 12.05, 18.86],
  ['SK', 'Slowakei', 47.73, 49.62, 16.84, 22.57],
  ['HU', 'Ungarn', 45.74, 48.58, 16.11, 22.9],
  ['RO', 'Rumänien', 43.62, 48.27, 20.26, 29.72],
  ['MD', 'Moldau', 45.45, 48.49, 26.62, 30.16],
  ['BG', 'Bulgarien', 41.24, 44.22, 22.36, 28.61],
  ['EE', 'Estland', 57.52, 59.69, 21.76, 28.21],
  ['LV', 'Lettland', 55.67, 58.09, 20.97, 28.24],
  ['LT', 'Litauen', 53.89, 56.45, 20.94, 26.84],
  ['UA', 'Ukraine', 44.0, 52.4, 22.1, 40.3],
  ['SI', 'Slowenien', 45.42, 46.88, 13.38, 16.61],
  ['HR', 'Kroatien', 42.35, 46.55, 13.49, 19.45],
  ['BA', 'Bosnien-Herzegowina', 42.55, 45.28, 15.72, 19.62],
  ['RS', 'Serbien', 42.23, 46.19, 18.82, 23.0],
  ['ME', 'Montenegro', 41.85, 43.56, 18.43, 20.36],
  ['XK', 'Kosovo', 41.85, 43.27, 20.01, 21.79],
  ['MK', 'Nordmazedonien', 40.85, 42.37, 20.45, 23.04],
  ['AL', 'Albanien', 39.64, 42.66, 19.26, 21.06],
  ['MA', 'Marokko', 30.4, 36.0, -10.0, -1.8],
  ['DZ', 'Algerien', 34.5, 37.3, -1.8, 8.7],
  ['TN', 'Tunesien', 33.0, 37.6, 8.0, 11.7],
  ['LY', 'Libyen', 30.5, 33.6, 11.0, 25.2],
  ['EG', 'Ägypten', 24.0, 31.7, 24.7, 34.4],
  ['LB', 'Libanon', 33.0, 34.7, 35.05, 36.65],
  ['IL', 'Israel/Palästina', 29.4, 33.4, 34.2, 35.95],
];

const FLAG = {
  CH: '🇨🇭', AT: '🇦🇹', DE: '🇩🇪', FR: '🇫🇷', IT: '🇮🇹', LU: '🇱🇺', BE: '🇧🇪', NL: '🇳🇱', PT: '🇵🇹', ES: '🇪🇸',
  DK: '🇩🇰', SE: '🇸🇪', NO: '🇳🇴', FI: '🇫🇮', GB: '🇬🇧', IE: '🇮🇪', IS: '🇮🇸', MT: '🇲🇹', CY: '🇨🇾', GR: '🇬🇷',
  PL: '🇵🇱', CZ: '🇨🇿', SK: '🇸🇰', HU: '🇭🇺', RO: '🇷🇴', MD: '🇲🇩', BG: '🇧🇬', EE: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹',
  UA: '🇺🇦', SI: '🇸🇮', HR: '🇭🇷', BA: '🇧🇦', RS: '🇷🇸', ME: '🇲🇪', XK: '🇽🇰', MK: '🇲🇰', AL: '🇦🇱',
  MA: '🇲🇦', DZ: '🇩🇿', TN: '🇹🇳', LY: '🇱🇾', EG: '🇪🇬', LB: '🇱🇧', IL: '🇮🇱',
};
const NAME_EN = {
  CH: 'Switzerland', AT: 'Austria', DE: 'Germany', FR: 'France', IT: 'Italy', LU: 'Luxembourg', BE: 'Belgium',
  NL: 'Netherlands', PT: 'Portugal', ES: 'Spain', DK: 'Denmark', SE: 'Sweden', NO: 'Norway', FI: 'Finland',
  GB: 'United Kingdom', IE: 'Ireland', IS: 'Iceland', MT: 'Malta', CY: 'Cyprus', GR: 'Greece', PL: 'Poland',
  CZ: 'Czechia', SK: 'Slovakia', HU: 'Hungary', RO: 'Romania', MD: 'Moldova', BG: 'Bulgaria', EE: 'Estonia',
  LV: 'Latvia', LT: 'Lithuania', UA: 'Ukraine', SI: 'Slovenia', HR: 'Croatia', BA: 'Bosnia and Herzegovina',
  RS: 'Serbia', ME: 'Montenegro', XK: 'Kosovo', MK: 'North Macedonia', AL: 'Albania', MA: 'Morocco',
  DZ: 'Algeria', TN: 'Tunisia', LY: 'Libya', EG: 'Egypt', LB: 'Lebanon', IL: 'Israel/Palestine',
};
const CAT = {
  de: { public: 'Öffentlich', transport: 'Verkehr (Bahnhof/Flughafen/ÖV)', gastronomy: 'Gastronomie', mall: 'Einkaufszentrum', nette_toilette: 'Nette Toilette (Partner)', event: 'Veranstaltung', private: 'Privat' },
  en: { public: 'Public', transport: 'Transport (station/airport/transit)', gastronomy: 'Gastronomy', mall: 'Shopping mall', nette_toilette: 'Nette Toilette (partner)', event: 'Event', private: 'Private' },
};

// ── Datenbeschaffung ────────────────────────────────────────────────────────
function fetchStats() {
  if (FROM_JSON) {
    console.log(`→ Lese Statistik aus ${FROM_JSON}`);
    return JSON.parse(readFileSync(FROM_JSON, 'utf8'));
  }
  console.log(`→ Ziehe Daten von ${SSH_HOST} (${PG_CONTAINER})…`);
  const sql =
    "SELECT round(latitude::numeric,5), round(longitude::numeric,5), category " +
    "FROM toilets WHERE status='active'";
  const remote = `sudo docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -t -A -F, -c "${sql}"`;
  const csv = execFileSync('ssh', ['-o', 'ConnectTimeout=15', SSH_HOST, remote], {
    maxBuffer: 512 * 1024 * 1024,
    encoding: 'utf8',
  });

  const boxes = BOXES.map((b) => ({
    code: b[0], name: b[1], la0: b[2], la1: b[3], lo0: b[4], lo1: b[5], area: (b[3] - b[2]) * (b[5] - b[4]),
  })).sort((a, b) => a.area - b.area);
  const names = {};
  for (const b of boxes) names[b.code] = b.name;

  const perCountry = {};
  const perCategory = {};
  let unassigned = 0;
  let total = 0;
  for (const line of csv.split('\n')) {
    if (!line) continue;
    const i1 = line.indexOf(',');
    const i2 = line.indexOf(',', i1 + 1);
    if (i1 < 0 || i2 < 0) continue;
    const lat = parseFloat(line.slice(0, i1));
    const lng = parseFloat(line.slice(i1 + 1, i2));
    const cat = line.slice(i2 + 1);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    total++;
    perCategory[cat] = (perCategory[cat] || 0) + 1;
    let found = null;
    for (const b of boxes) {
      if (lat >= b.la0 && lat <= b.la1 && lng >= b.lo0 && lng <= b.lo1) {
        found = b.code;
        break;
      }
    }
    if (found) perCountry[found] = (perCountry[found] || 0) + 1;
    else unassigned++;
  }
  const countries = Object.entries(perCountry)
    .map(([code, n]) => ({ code, name: names[code], n }))
    .sort((a, b) => b.n - a.n);
  return {
    total,
    generatedAt: DATE,
    categories: Object.entries(perCategory).map(([k, v]) => ({ category: k, n: v })).sort((a, b) => b.n - a.n),
    countries,
    countryCount: countries.length,
    unassigned,
  };
}

// ── Übersetzungen für das Dokument ──────────────────────────────────────────
const T = {
  de: {
    locale: 'de-CH', lang: 'de', title: 'Statistik-Report',
    subtitle: 'Community-Plattform für öffentlich zugängliche Toiletten · Bestand der Karte',
    stand: 'Stand', kpis: 'Kennzahlen', k_toilets: 'Toiletten (aktiv)', k_countries: 'Länder',
    k_cats: 'Rubriken belegt', k_langs: 'Sprachen (inkl. RTL)', cats: 'Rubriken', col_cat: 'Rubrik',
    col_count: 'Anzahl', col_share: 'Anteil', col_dist: 'Verteilung', countries: 'Länder',
    countries_sub: (n) => `— ${n} Länder, nach Anzahl`, col_country: 'Land',
    note: (u, p) => `Länderzuordnung geografisch aus den Koordinaten (kleinste enthaltende Bounding-Box). ${u} Einträge (${p} %) liessen sich keinem Land eindeutig zuordnen.`,
    legal: 'Impressum & Datenquellen',
    L: {
      op: ['Betreiber:', 'Transivroom Division'],
      ct: ['Kontakt:', 'admin@4cpa.ch · <span class="brand">klopilot.ch</span>'],
      rc: ['Verantwortlich für den Inhalt:', 'Transivroom Division, erreichbar unter admin@4cpa.ch.'],
      ho: ['Hosting:', 'Infomaniak Network SA, Rue Eugène Marziano 25, 1227 Genf (Schweiz). Server und Daten ausschliesslich in der Schweiz.'],
      ds: ['Datenquelle Standorte:', 'teilweise OpenStreetMap, © OpenStreetMap-Mitwirkende, lizenziert unter ODbL 1.0 (openstreetmap.org/copyright).'],
      tl: ['Kartenkacheln:', 'MapTiler / Esri nach deren Nutzungsbedingungen.'],
      us: ['Nutzung:', 'kostenlos und werbefrei für Endnutzer; keine Datenverkäufe.'],
      lw: ['Recht & Datenschutz:', 'revDSG (CH), DSGVO (EU/EWR) als Mindeststandard; Details unter klopilot.ch/impressum, /datenschutz und /agb.'],
    },
    foot_l: 'klopilot.ch · automatisch generierter Statistik-Report',
    foot_r: (d) => `Basis: aktive Toiletten · Stand ${d}`,
  },
  en: {
    locale: 'en-GB', lang: 'en', title: 'Statistics Report',
    subtitle: 'Community platform for publicly accessible toilets · map inventory',
    stand: 'As of', kpis: 'Key figures', k_toilets: 'Toilets (active)', k_countries: 'Countries',
    k_cats: 'Categories in use', k_langs: 'Languages (incl. RTL)', cats: 'Categories', col_cat: 'Category',
    col_count: 'Count', col_share: 'Share', col_dist: 'Distribution', countries: 'Countries',
    countries_sub: (n) => `— ${n} countries, by count`, col_country: 'Country',
    note: (u, p) => `Country assignment is derived geographically from coordinates (smallest enclosing bounding box). ${u} entries (${p} %) could not be assigned to a single country.`,
    legal: 'Legal notice & data sources',
    L: {
      op: ['Operator:', 'Transivroom Division'],
      ct: ['Contact:', 'admin@4cpa.ch · <span class="brand">klopilot.ch</span>'],
      rc: ['Responsible for content:', 'Transivroom Division, reachable at admin@4cpa.ch.'],
      ho: ['Hosting:', 'Infomaniak Network SA, Rue Eugène Marziano 25, 1227 Geneva (Switzerland). Servers and data exclusively in Switzerland.'],
      ds: ['Location data source:', 'partly OpenStreetMap, © OpenStreetMap contributors, licensed under ODbL 1.0 (openstreetmap.org/copyright).'],
      tl: ['Map tiles:', 'MapTiler / Esri under their respective terms of use.'],
      us: ['Usage:', 'free of charge and ad-free for end users; no data sales.'],
      lw: ['Law & privacy:', 'Swiss revFADP and EU GDPR (EU/EEA) as a minimum standard; details at klopilot.ch/impressum, /datenschutz and /agb.'],
    },
    foot_l: 'klopilot.ch · automatically generated statistics report',
    foot_r: (d) => `Basis: active toilets · as of ${d}`,
  },
};

const LOGO = readFileSync(resolve(WEB, 'public', 'favicon.svg'), 'utf8').replace(
  '<svg ',
  '<svg width="46" height="46" ',
);

function buildHtml(langKey, s) {
  const t = T[langKey];
  const nf = new Intl.NumberFormat(t.locale);
  const pf = new Intl.NumberFormat(t.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt = (n) => nf.format(n);
  const pct = (n) => pf.format((n / s.total) * 100) + ' %';
  const cname = (c) => (langKey === 'en' ? NAME_EN[c.code] || c.name : c.name);
  const catName = (k) => CAT[langKey][k] || k;

  const catRows = s.categories
    .map(
      (c) => `<tr><td>${catName(c.category)}</td><td class="num">${fmt(c.n)}</td>` +
        `<td class="num muted">${pct(c.n)}</td>` +
        `<td class="bar"><span style="width:${((c.n / s.total) * 100).toFixed(1)}%"></span></td></tr>`,
    )
    .join('');
  const maxC = s.countries[0].n;
  const ctyRows = s.countries
    .map(
      (c, i) => `<tr><td class="rank">${i + 1}</td><td class="flag">${FLAG[c.code] || ''}</td>` +
        `<td>${cname(c)}</td><td class="num">${fmt(c.n)}</td><td class="num muted">${pct(c.n)}</td>` +
        `<td class="bar"><span style="width:${((c.n / maxC) * 100).toFixed(1)}%"></span></td></tr>`,
    )
    .join('');
  const legalRow = (k) => `<p><strong>${t.L[k][0]}</strong> ${t.L[k][1]}</p>`;
  const upct = pf.format((s.unassigned / s.total) * 100);

  return `<!doctype html><html lang="${t.lang}"><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#1c2433; font-size:11px; line-height:1.5; margin:0; }
  .brand { color:#FF6B35; }
  header { display:flex; align-items:center; gap:14px; border-bottom:3px solid #FF6B35; padding-bottom:14px; margin-bottom:22px; }
  header h1 { margin:0; font-size:24px; letter-spacing:-0.02em; }
  header .word { font-weight:800; }
  header .sub { color:#6b7280; font-size:11px; margin-top:2px; }
  header .meta { margin-left:auto; text-align:right; color:#6b7280; font-size:10px; }
  h2 { font-size:14px; margin:22px 0 10px; padding-bottom:5px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; gap:7px; }
  .cards { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  .card { border:1px solid #eee; border-radius:10px; padding:12px 14px; background:#fafafa; }
  .card .v { font-size:22px; font-weight:800; color:#FF6B35; line-height:1.1; }
  .card .l { color:#6b7280; font-size:10px; margin-top:3px; }
  table { width:100%; border-collapse:collapse; }
  th,td { padding:5px 8px; text-align:left; }
  thead th { font-size:9px; text-transform:uppercase; letter-spacing:0.05em; color:#9ca3af; border-bottom:1px solid #e5e7eb; }
  tbody tr:nth-child(even) { background:#fafafa; }
  td.num { text-align:right; font-variant-numeric:tabular-nums; font-weight:600; }
  td.muted { color:#9ca3af; font-weight:400; }
  td.rank { color:#c0c4cc; width:22px; text-align:right; }
  td.flag { width:20px; font-size:13px; }
  td.bar { width:26%; }
  td.bar span { display:block; height:7px; border-radius:4px; background:linear-gradient(90deg,#FF6B35,#EF476F); }
  .twocol { column-count:2; column-gap:22px; }
  .legal { font-size:10px; color:#374151; }
  .legal p { margin:4px 0; break-inside:avoid; }
  .legal strong { color:#1c2433; }
  footer { margin-top:18px; padding-top:10px; border-top:1px solid #e5e7eb; color:#9ca3af; font-size:9px; display:flex; justify-content:space-between; }
  .note { color:#9ca3af; font-size:9.5px; margin-top:6px; }
</style></head><body>
<header>
  <div class="logo">${LOGO}</div>
  <div>
    <h1><span class="word">klopilot</span><span class="brand">.ch</span> — ${t.title}</h1>
    <div class="sub">${t.subtitle}</div>
  </div>
  <div class="meta">${t.stand}: ${s.generatedAt}<br>© 2026 Transivroom Division</div>
</header>
<h2>📊 ${t.kpis}</h2>
<div class="cards">
  <div class="card"><div class="v">${fmt(s.total)}</div><div class="l">${t.k_toilets}</div></div>
  <div class="card"><div class="v">${s.countryCount}</div><div class="l">${t.k_countries}</div></div>
  <div class="card"><div class="v">${s.categories.length}</div><div class="l">${t.k_cats}</div></div>
  <div class="card"><div class="v">31</div><div class="l">${t.k_langs}</div></div>
</div>
<h2>🗂️ ${t.cats}</h2>
<table><thead><tr><th>${t.col_cat}</th><th style="text-align:right">${t.col_count}</th><th style="text-align:right">${t.col_share}</th><th>${t.col_dist}</th></tr></thead><tbody>${catRows}</tbody></table>
<h2>🌍 ${t.countries} <span style="font-weight:400;color:#9ca3af;font-size:11px">${t.countries_sub(s.countryCount)}</span></h2>
<table><thead><tr><th></th><th></th><th>${t.col_country}</th><th style="text-align:right">${t.col_count}</th><th style="text-align:right">${t.col_share}</th><th>${t.col_dist}</th></tr></thead><tbody>${ctyRows}</tbody></table>
<div class="note">${t.note(fmt(s.unassigned), upct)}</div>
<h2>⚖️ ${t.legal}</h2>
<div class="legal twocol">${legalRow('op')}${legalRow('ct')}${legalRow('rc')}${legalRow('ho')}${legalRow('ds')}${legalRow('tl')}${legalRow('us')}${legalRow('lw')}</div>
<footer><span>${t.foot_l}</span><span>${t.foot_r(s.generatedAt)}</span></footer>
</body></html>`;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const stats = fetchStats();
  console.log(
    `✔ ${stats.total.toLocaleString('de-CH')} aktive Toiletten · ${stats.countryCount} Länder · ` +
      `${stats.unassigned} ohne Zuordnung (${((stats.unassigned / stats.total) * 100).toFixed(2)} %)`,
  );

  writeFileSync(resolve(OUT, 'klopilot-stats.json'), JSON.stringify(stats, null, 2) + '\n');

  const files = [
    { key: 'de', base: 'klopilot-statistik' },
    { key: 'en', base: 'klopilot-statistics' },
  ];
  for (const f of files) {
    writeFileSync(resolve(OUT, `${f.base}.html`), buildHtml(f.key, stats));
    console.log(`✔ ${f.base}.html`);
  }

  if (NO_PDF) {
    console.log('→ --no-pdf: PDF-Rendering übersprungen.');
    return;
  }
  const browser = await chromium.launch();
  for (const f of files) {
    const page = await browser.newPage();
    await page.goto('file://' + resolve(OUT, `${f.base}.html`), { waitUntil: 'networkidle' });
    await page.pdf({
      path: resolve(OUT, `${f.base}.pdf`),
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    await page.close();
    console.log(`✔ ${f.base}.pdf`);
  }
  await browser.close();
  console.log(`\nFertig → ${OUT}`);
}

main().catch((err) => {
  console.error('Report-Generierung fehlgeschlagen:', err.message);
  process.exit(1);
});
