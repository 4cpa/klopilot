/**
 * Seed: 60 Test-Toiletten in Schweizer Städten + 2 Nutzer + Ratings
 * Aufruf: pnpm --filter api db:seed
 */
import { PrismaClient, ToiletCategory, Visibility } from '@prisma/client';

const prisma = new PrismaClient();

// ── Typen ────────────────────────────────────────────────────────────────────

type CriteriaScores = Partial<
  Record<
    | 'accessibility'
    | 'cleanliness'
    | 'hygiene'
    | 'style'
    | 'amenities'
    | 'safety'
    | 'inclusivity'
    | 'cost'
    | 'wait'
    | 'kids',
    number
  >
>;

// ── Daten ────────────────────────────────────────────────────────────────────

const SEED_TOILETS: Array<{
  name: string;
  category: ToiletCategory;
  visibility: Visibility;
  longitude: number;
  latitude: number;
  address?: string;
  feeChf?: number;
}> = [
  // Bern
  {
    name: 'WC Bundesplatz',
    category: 'public',
    visibility: 'public',
    longitude: 7.4441,
    latitude: 46.9466,
    address: 'Bundesplatz, 3003 Bern',
  },
  {
    name: 'WC Bahnhof Bern Haupthalle',
    category: 'transport',
    visibility: 'public',
    longitude: 7.4394,
    latitude: 46.949,
    address: 'Bahnhofplatz 10, 3011 Bern',
    feeChf: 1.0,
  },
  {
    name: 'WC Bärengraben',
    category: 'public',
    visibility: 'public',
    longitude: 7.4594,
    latitude: 46.948,
    address: 'Grosser Muristalden 6, 3006 Bern',
  },
  {
    name: 'Café Anker WC',
    category: 'gastronomy',
    visibility: 'nette_toilette',
    longitude: 7.443,
    latitude: 46.9472,
    address: 'Hodlerstrasse 7, 3011 Bern',
  },
  {
    name: 'WC Münsterplattform',
    category: 'public',
    visibility: 'public',
    longitude: 7.4496,
    latitude: 46.9462,
    address: 'Münsterplattform, 3011 Bern',
  },
  {
    name: 'WC Waisenhausplatz',
    category: 'public',
    visibility: 'public',
    longitude: 7.4443,
    latitude: 46.9486,
    address: 'Waisenhausplatz, 3011 Bern',
  },
  {
    name: 'WC Kornhausbrücke',
    category: 'public',
    visibility: 'public',
    longitude: 7.4408,
    latitude: 46.9507,
    address: 'Kornhausbrücke, 3013 Bern',
  },
  {
    name: 'Westside Shopping Mall',
    category: 'mall',
    visibility: 'public',
    longitude: 7.39,
    latitude: 46.9392,
    address: 'Riedbachstrasse 100, 3027 Bern',
  },
  {
    name: 'WC Rosengarten Bern',
    category: 'public',
    visibility: 'public',
    longitude: 7.453,
    latitude: 46.9554,
    address: 'Alter Aargauerstalden 31b, 3006 Bern',
  },
  {
    name: 'WC Botanischer Garten',
    category: 'public',
    visibility: 'public',
    longitude: 7.4356,
    latitude: 46.9529,
    address: 'Altenbergrain 21, 3013 Bern',
  },
  {
    name: 'WC Helvetiaplatz',
    category: 'public',
    visibility: 'public',
    longitude: 7.437,
    latitude: 46.9444,
    address: 'Helvetiaplatz, 3005 Bern',
  },
  {
    name: 'Rest. Schwellenmätteli',
    category: 'gastronomy',
    visibility: 'nette_toilette',
    longitude: 7.4554,
    latitude: 46.9438,
    address: 'Dalmaziquai 11, 3005 Bern',
  },

  // Zürich
  {
    name: 'WC Hauptbahnhof Zürich',
    category: 'transport',
    visibility: 'public',
    longitude: 8.5403,
    latitude: 47.3782,
    address: 'Bahnhofplatz, 8001 Zürich',
    feeChf: 1.0,
  },
  {
    name: 'WC Paradeplatz',
    category: 'public',
    visibility: 'public',
    longitude: 8.5394,
    latitude: 47.3699,
    address: 'Paradeplatz, 8001 Zürich',
  },
  {
    name: 'WC Lindenhügel',
    category: 'public',
    visibility: 'public',
    longitude: 8.5414,
    latitude: 47.3734,
    address: 'Lindenhügel, 8001 Zürich',
  },
  {
    name: 'Shopville WC',
    category: 'mall',
    visibility: 'public',
    longitude: 8.5392,
    latitude: 47.3777,
    address: 'Shopville, 8001 Zürich',
    feeChf: 0.5,
  },
  {
    name: 'WC Zürichhorn',
    category: 'public',
    visibility: 'public',
    longitude: 8.5585,
    latitude: 47.3538,
    address: 'Zürichhorn, 8008 Zürich',
  },
  {
    name: 'WC Uetliberg Gipfel',
    category: 'public',
    visibility: 'public',
    longitude: 8.4921,
    latitude: 47.3493,
    address: 'Uetliberg 1, 8142 Uitikon Waldegg',
  },
  {
    name: 'WC Bellevue Zürich',
    category: 'public',
    visibility: 'public',
    longitude: 8.5449,
    latitude: 47.3659,
    address: 'Bellevueplatz, 8008 Zürich',
  },
  {
    name: 'Café Bar OQ',
    category: 'gastronomy',
    visibility: 'nette_toilette',
    longitude: 8.5321,
    latitude: 47.377,
    address: 'Heinrichstrasse 70, 8005 Zürich',
  },
  {
    name: 'WC Grossmünster',
    category: 'public',
    visibility: 'public',
    longitude: 8.5441,
    latitude: 47.37,
    address: 'Zwingliplatz, 8001 Zürich',
  },
  {
    name: 'Flughafen Zürich T1',
    category: 'transport',
    visibility: 'public',
    longitude: 8.562,
    latitude: 47.4497,
    address: 'Flughafenstrasse 7, 8058 Zürich',
  },

  // Basel
  {
    name: 'WC Marktplatz Basel',
    category: 'public',
    visibility: 'public',
    longitude: 7.5886,
    latitude: 47.5596,
    address: 'Marktplatz, 4001 Basel',
  },
  {
    name: 'WC Münster Basel',
    category: 'public',
    visibility: 'public',
    longitude: 7.5916,
    latitude: 47.556,
    address: 'Münsterplatz, 4001 Basel',
  },
  {
    name: 'WC Badischer Bahnhof',
    category: 'transport',
    visibility: 'public',
    longitude: 7.6097,
    latitude: 47.568,
    address: 'Schwarzwaldallee 200, 4058 Basel',
    feeChf: 0.5,
  },
  {
    name: 'WC Kunstmuseum Basel',
    category: 'public',
    visibility: 'public',
    longitude: 7.5949,
    latitude: 47.5551,
    address: 'St. Alban-Graben 16, 4051 Basel',
  },
  {
    name: 'Claraplatz WC',
    category: 'public',
    visibility: 'public',
    longitude: 7.596,
    latitude: 47.5631,
    address: 'Claraplatz, 4057 Basel',
  },

  // Genf
  {
    name: "WC Jet d'Eau Genf",
    category: 'public',
    visibility: 'public',
    longitude: 6.1558,
    latitude: 46.2063,
    address: 'Quai Gustave-Ador, 1207 Genève',
  },
  {
    name: 'WC Gare Cornavin',
    category: 'transport',
    visibility: 'public',
    longitude: 6.1422,
    latitude: 46.21,
    address: 'Place de Cornavin 1, 1201 Genève',
    feeChf: 1.0,
  },
  {
    name: 'WC Parc des Bastions',
    category: 'public',
    visibility: 'public',
    longitude: 6.1463,
    latitude: 46.2011,
    address: 'Promenade des Bastions, 1205 Genève',
  },
  {
    name: 'WC Place du Rhône',
    category: 'public',
    visibility: 'public',
    longitude: 6.1488,
    latitude: 46.205,
    address: 'Place du Rhône, 1204 Genève',
  },
  {
    name: 'Plainpalais WC',
    category: 'public',
    visibility: 'public',
    longitude: 6.142,
    latitude: 46.1985,
    address: 'Plaine de Plainpalais, 1205 Genève',
  },

  // Lausanne
  {
    name: 'WC Place de la Palud',
    category: 'public',
    visibility: 'public',
    longitude: 6.6323,
    latitude: 46.5219,
    address: 'Place de la Palud, 1003 Lausanne',
  },
  {
    name: 'WC Gare Lausanne',
    category: 'transport',
    visibility: 'public',
    longitude: 6.6291,
    latitude: 46.517,
    address: 'Place de la Gare, 1003 Lausanne',
    feeChf: 1.0,
  },
  {
    name: 'WC Parc de Mon-Repos',
    category: 'public',
    visibility: 'public',
    longitude: 6.6363,
    latitude: 46.5235,
    address: 'Avenue du Tribunal-Fédéral, 1005 Lausanne',
  },
  {
    name: 'WC Ouchy Lac',
    category: 'public',
    visibility: 'public',
    longitude: 6.6282,
    latitude: 46.507,
    address: 'Ouchy, 1006 Lausanne',
  },

  // Luzern
  {
    name: 'WC Kapellbrücke',
    category: 'public',
    visibility: 'public',
    longitude: 8.3094,
    latitude: 47.0513,
    address: 'Kapellbrücke, 6003 Luzern',
  },
  {
    name: 'WC Luzern Bahnhof',
    category: 'transport',
    visibility: 'public',
    longitude: 8.3102,
    latitude: 47.0502,
    address: 'Bahnhofplatz, 6002 Luzern',
    feeChf: 0.5,
  },
  {
    name: 'WC Schwanenplatz',
    category: 'public',
    visibility: 'public',
    longitude: 8.3128,
    latitude: 47.0517,
    address: 'Schwanenplatz, 6004 Luzern',
  },
  {
    name: 'WC Löwendenkmal',
    category: 'public',
    visibility: 'public',
    longitude: 8.3177,
    latitude: 47.0573,
    address: 'Denkmalstrasse 4, 6002 Luzern',
  },

  // St. Gallen
  {
    name: 'WC St. Gallen Bahnhof',
    category: 'transport',
    visibility: 'public',
    longitude: 9.371,
    latitude: 47.4226,
    address: 'Bahnhofplatz 1, 9001 St. Gallen',
    feeChf: 1.0,
  },
  {
    name: 'WC Marktplatz St. Gallen',
    category: 'public',
    visibility: 'public',
    longitude: 9.377,
    latitude: 47.4235,
    address: 'Marktgasse, 9000 St. Gallen',
  },

  // Winterthur
  {
    name: 'WC Winterthur HB',
    category: 'transport',
    visibility: 'public',
    longitude: 8.7242,
    latitude: 47.5002,
    address: 'Bahnhofplatz 2, 8400 Winterthur',
    feeChf: 0.5,
  },
  {
    name: 'WC Stadtgarten Winterthur',
    category: 'public',
    visibility: 'public',
    longitude: 8.7271,
    latitude: 47.4978,
    address: 'Stadthausstrasse, 8402 Winterthur',
  },

  // Thun
  {
    name: 'WC Thun Bahnhof',
    category: 'transport',
    visibility: 'public',
    longitude: 7.6283,
    latitude: 46.7572,
    address: 'Bahnhofplatz, 3600 Thun',
    feeChf: 0.5,
  },
  {
    name: 'WC Schadau Park Thun',
    category: 'public',
    visibility: 'public',
    longitude: 7.636,
    latitude: 46.7521,
    address: 'Seestrasse 45, 3600 Thun',
  },

  // Interlaken
  {
    name: 'WC Interlaken West',
    category: 'transport',
    visibility: 'public',
    longitude: 7.8512,
    latitude: 46.6863,
    address: 'Bahnhofplatz, 3800 Interlaken',
  },
  {
    name: 'WC Höheweg Interlaken',
    category: 'public',
    visibility: 'public',
    longitude: 7.8641,
    latitude: 46.686,
    address: 'Höheweg 35, 3800 Interlaken',
  },

  // Lugano
  {
    name: 'WC Piazza della Riforma',
    category: 'public',
    visibility: 'public',
    longitude: 8.9519,
    latitude: 46.0037,
    address: 'Piazza della Riforma, 6900 Lugano',
  },
  {
    name: 'WC Lugano Stazione',
    category: 'transport',
    visibility: 'public',
    longitude: 8.9471,
    latitude: 46.0044,
    address: 'Piazzale Stazione, 6900 Lugano',
    feeChf: 1.0,
  },

  // Zug
  {
    name: 'WC Zug Bahnhof',
    category: 'transport',
    visibility: 'public',
    longitude: 8.515,
    latitude: 47.1661,
    address: 'Bahnhofplatz, 6300 Zug',
  },
  {
    name: 'WC Zugersee Ufer',
    category: 'public',
    visibility: 'public',
    longitude: 8.5167,
    latitude: 47.1637,
    address: 'Seeufer, 6300 Zug',
  },

  // Fribourg
  {
    name: 'WC Fribourg Bahnhof',
    category: 'transport',
    visibility: 'public',
    longitude: 7.1511,
    latitude: 46.8032,
    address: 'Place de la Gare, 1700 Fribourg',
  },
  {
    name: 'WC Cathédrale Fribourg',
    category: 'public',
    visibility: 'public',
    longitude: 7.1563,
    latitude: 46.8067,
    address: 'Place Notre-Dame, 1700 Fribourg',
  },
];

const SEED_RATINGS: Array<{
  toiletIndex: number;
  flowers?: CriteriaScores;
  flies?: CriteriaScores;
}> = [
  { toiletIndex: 0, flowers: { accessibility: 4, cleanliness: 5, hygiene: 4, style: 3 } },
  {
    toiletIndex: 1,
    flowers: { accessibility: 5, cleanliness: 4, hygiene: 5, amenities: 4 },
    flies: { style: 2 },
  },
  { toiletIndex: 2, flowers: { cleanliness: 3, hygiene: 3 }, flies: { accessibility: 1 } },
  {
    toiletIndex: 12,
    flowers: { accessibility: 5, cleanliness: 5, hygiene: 5, amenities: 5, style: 4 },
  },
  { toiletIndex: 13, flowers: { cleanliness: 3 }, flies: { wait: 2 } },
  { toiletIndex: 22, flowers: { accessibility: 4, cleanliness: 4 } },
  { toiletIndex: 28, flowers: { cleanliness: 5, hygiene: 5, style: 4 } },
];

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seed startet...');

  // 1. Seed-User anlegen
  const seedUser = await prisma.user.upsert({
    where: { handle: 'seed_bot' },
    update: {},
    create: {
      handle: 'seed_bot',
      email: 'seed@klopilot.ch',
      role: 'admin',
      locale: 'de',
    },
  });

  const raterUser = await prisma.user.upsert({
    where: { handle: 'test_rater' },
    update: {},
    create: {
      handle: 'test_rater',
      email: 'rater@klopilot.ch',
      role: 'user',
      locale: 'de',
    },
  });

  console.log(`  ✓ Nutzer: ${seedUser.handle}, ${raterUser.handle}`);

  // 2. Toiletten anlegen + geom setzen
  const toiletIds: string[] = [];

  for (const t of SEED_TOILETS) {
    const existing = await prisma.toilet.findFirst({
      where: { name: t.name, latitude: t.latitude, longitude: t.longitude },
    });

    let id: string;
    if (existing) {
      id = existing.id;
    } else {
      const created = await prisma.toilet.create({
        data: {
          name: t.name,
          category: t.category,
          visibility: t.visibility,
          longitude: t.longitude,
          latitude: t.latitude,
          address: t.address,
          feeChf: t.feeChf != null ? t.feeChf : undefined,
          createdById: seedUser.id,
        },
      });
      id = created.id;
    }

    // PostGIS geom setzen (Pflicht für ST_DWithin-Suche)
    await prisma.$executeRaw`
      UPDATE toilets
      SET    geom = ST_SetSRID(ST_MakePoint(${t.longitude}, ${t.latitude}), 4326)::geography
      WHERE  id = ${id}::uuid
    `;

    toiletIds.push(id);
  }

  console.log(`  ✓ ${toiletIds.length} Toiletten angelegt/aktualisiert`);

  // 3. Ratings anlegen
  let ratingCount = 0;
  for (const r of SEED_RATINGS) {
    const toiletId = toiletIds[r.toiletIndex];
    if (!toiletId) continue;

    try {
      await prisma.rating.upsert({
        where: { toiletId_userId: { toiletId, userId: raterUser.id } },
        update: {},
        create: {
          toiletId,
          userId: raterUser.id,
          flowersAccessibility: r.flowers?.accessibility ?? 0,
          fliesAccessibility: r.flies?.accessibility ?? 0,
          flowersCleanliness: r.flowers?.cleanliness ?? 0,
          fliesCleanliness: r.flies?.cleanliness ?? 0,
          flowersHygiene: r.flowers?.hygiene ?? 0,
          fliesHygiene: r.flies?.hygiene ?? 0,
          flowersStyle: r.flowers?.style ?? 0,
          fliesStyle: r.flies?.style ?? 0,
          flowersAmenities: r.flowers?.amenities ?? 0,
          fliesAmenities: r.flies?.amenities ?? 0,
          flowersSafety: r.flowers?.safety ?? 0,
          fliesSafety: r.flies?.safety ?? 0,
          flowersInclusivity: r.flowers?.inclusivity ?? 0,
          fliesInclusivity: r.flies?.inclusivity ?? 0,
          flowersCost: r.flowers?.cost ?? 0,
          fliesCost: r.flies?.cost ?? 0,
          flowersWait: r.flowers?.wait ?? 0,
          fliesWait: r.flies?.wait ?? 0,
          flowersKids: r.flowers?.kids ?? 0,
          fliesKids: r.flies?.kids ?? 0,
          language: 'de',
        },
      });
      ratingCount++;
    } catch {
      // ignorieren falls Constraint verletzt
    }
  }

  console.log(`  ✓ ${ratingCount} Ratings angelegt`);
  console.log('🌸 Seed abgeschlossen.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
