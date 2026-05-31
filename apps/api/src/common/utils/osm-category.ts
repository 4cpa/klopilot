/**
 * OSM-Tag → klopilot-Kategorie.
 *
 * Bewusst als eigenes, seiteneffektfreies Modul (importierbar/testbar), während
 * `seed-osm.ts` beim Import den eigentlichen Overpass-Import startet.
 */

export type OsmCategory =
  | 'public'
  | 'nette_toilette'
  | 'gastronomy'
  | 'transport'
  | 'mall'
  | 'event';

// Gastronomie-amenities, deren Toiletten als gastronomy gelten
const GASTRO_AMENITIES = [
  'restaurant',
  'cafe',
  'bar',
  'pub',
  'fast_food',
  'biergarten',
  'food_court',
  'ice_cream',
];

// Gastronomie-Hinweise im NAMEN. Viele Restaurant-/Café-Toiletten tragen keinen
// strukturierten Venue-Tag, sondern nur den Lokalnamen ("Restaurant Baseltor",
// "Café Achteck", "Beizli"). Diese Erkennung schützt sie davor, allein wegen
// Bahnhofs-/Mall-Nähe als Transport/Mall zu gelten.
//
// Lange, eindeutige Begriffe matchen als Substring (greift auch in Komposita wie
// «Bahnhofrestaurant»). Kurze/mehrdeutige Begriffe nur mit Wortgrenzen, damit
// «bar» in «Barcelona» oder «wirtschaft» in «Landwirtschaft» nicht fälschlich greift.
const NAME_GASTRO_SUBSTR =
  /(restaurant|ristorante|trattoria|osteria|pizzeria|brasserie|gasthaus|gasthof|gaststätte|gastwirtschaft|wirtshaus|biergarten|kneipe|taverne|taverna|brauerei|caf[eé])/;
const NAME_GASTRO_WORD = /\b(bar|pub|beizli|beiz|bistro|bistrot|imbiss|wirtschaft)\b/;
function hasGastroName(name: string): boolean {
  return NAME_GASTRO_SUBSTR.test(name) || NAME_GASTRO_WORD.test(name);
}

// ── OSM-Tag → unsere Kategorie ────────────────────────────────────────────────
//
// WICHTIG: Transport wird ausschliesslich aus STRUKTURIERTEN Tags abgeleitet
// (public_transport / railway / aeroway / location), NICHT aus dem Namen.
// Die frühere Namens-Heuristik (Substring «gare», «station», «bahnhof» …)
// klassifizierte Restaurants wie «Café de la Gare» oder «Restaurant Bahnhöfli»
// fälschlich als Transport. Gastronomie-/Shop-Signale haben zudem Vorrang vor
// Transport, damit eine Restaurant-Toilette im Bahnhof Gastronomie bleibt.
export function mapCategory(tags: Record<string, string>): OsmCategory {
  const name = (tags['name'] ?? tags['description'] ?? '').toLowerCase();
  const loc = (tags['location'] ?? '').toLowerCase();
  const op = (tags['operator:type'] ?? tags['operator'] ?? '').toLowerCase();
  const acc = (tags['access'] ?? '').toLowerCase();

  // 1) Nette Toilette (präzise Tags / Operator) — höchste Priorität
  if (
    tags['nette_toilette'] === 'yes' ||
    tags['toilets:scheme'] === 'nette_toilette' ||
    op.includes('nette toilette') ||
    name.includes('nette toilette')
  )
    return 'nette_toilette';

  // 2) Gastronomie — echte Venue-Tags ODER eindeutiger Lokalname (vor Transport!)
  if (
    acc === 'customers' ||
    GASTRO_AMENITIES.includes(tags['amenity'] ?? '') ||
    /\b(restaurant|cafe|café|bistro|brasserie|trattoria|osteria)\b/.test(loc) ||
    hasGastroName(name)
  )
    return 'gastronomy';

  // 3) Mall / Einkaufszentrum — Shop-Tags bzw. eindeutige location-Werte
  if (
    !!tags['shop'] ||
    loc.includes('mall') ||
    loc.includes('shopping') ||
    op.includes('einkaufszentrum')
  )
    return 'mall';

  // 4) Transport — NUR strukturierte Tags, keine Namens-Heuristik
  if (
    !!tags['public_transport'] ||
    !!tags['railway'] ||
    !!tags['aeroway'] ||
    /\b(station|airport|railway|platform|aerodrome|bus_station)\b/.test(loc)
  )
    return 'transport';

  // 5) Öffentlich (Gemeinde/Stadt-Operator)
  if (
    op.includes('gemeinde') ||
    op.includes('stadt') ||
    op.includes('canton') ||
    op.includes('municipality') ||
    op.includes('mairie') ||
    op.includes('commune') ||
    op.includes('ville') ||
    op.includes('città') ||
    op.includes('comune')
  )
    return 'public';

  return 'public';
}

/**
 * Endgültige Kategorie unter Berücksichtigung eines Phasen-Hints.
 * - `nette_toilette`-Hint stammt aus einem präzisen Positiv-Filter → gewinnt immer.
 * - Nähe-basierte Hints (`transport`, `mall`) werden NUR angewendet, wenn die
 *   eigenen Tags die Toilette nicht bereits spezifisch einordnen. So überschreibt
 *   blosse Bahnhofs-/Mall-Nähe keine erkannte Restaurant- oder Shop-Toilette.
 */
export function resolveCategory(tags: Record<string, string>, hint?: OsmCategory): OsmCategory {
  const natural = mapCategory(tags);
  if (hint === 'nette_toilette') return 'nette_toilette';
  if (hint && natural === 'public') return hint;
  return natural;
}
