import { describe, it, expect } from 'vitest';
import { mapCategory, resolveCategory } from './osm-category';

describe('mapCategory', () => {
  it('klassifiziert echte Transport-Toiletten via strukturierte Tags', () => {
    expect(mapCategory({ amenity: 'toilets', railway: 'platform' })).toBe('transport');
    expect(mapCategory({ amenity: 'toilets', public_transport: 'platform' })).toBe('transport');
    expect(mapCategory({ amenity: 'toilets', aeroway: 'terminal' })).toBe('transport');
    expect(mapCategory({ amenity: 'toilets', location: 'station' })).toBe('transport');
  });

  it('klassifiziert KEINE Restaurants/Cafés als Transport (Namens-Zufälle)', () => {
    // Genau die Fehlerfälle aus der Produktionsdatenbank
    expect(mapCategory({ name: 'Café de la Gare' })).not.toBe('transport');
    expect(mapCategory({ name: 'Restaurant Bahnhöfli', access: 'customers' })).toBe('gastronomy');
    expect(mapCategory({ name: 'Restaurant Baseltor' })).not.toBe('transport');
    expect(mapCategory({ name: 'Bar Stazione Centrale' })).not.toBe('transport');
    expect(mapCategory({ name: 'Pizzeria Terminal' })).not.toBe('transport');
  });

  it('erkennt Gastronomie aus echten Tags', () => {
    expect(mapCategory({ amenity: 'restaurant' })).toBe('gastronomy');
    expect(mapCategory({ amenity: 'cafe' })).toBe('gastronomy');
    expect(mapCategory({ access: 'customers' })).toBe('gastronomy');
    expect(mapCategory({ location: 'restaurant' })).toBe('gastronomy');
  });

  it('erkennt Gastronomie aus dem Lokalnamen (ohne Venue-Tag)', () => {
    // Genau die nach dem ersten Import noch falschen Fälle
    expect(mapCategory({ name: 'Restaurant Baseltor' })).toBe('gastronomy');
    expect(mapCategory({ name: 'Café Achteck' })).toBe('gastronomy');
    expect(mapCategory({ name: 'Cafébar Barock' })).toBe('gastronomy');
    expect(mapCategory({ name: 'WC Terminal-Beizli' })).toBe('gastronomy');
    expect(mapCategory({ name: 'Pizzeria Roma' })).toBe('gastronomy');
    expect(mapCategory({ name: 'Wirtschaft zum Löwen' })).toBe('gastronomy');
  });

  it('löst durch Wortgrenzen keine Fehltreffer aus', () => {
    // «bar» in «Barcelona», «wirtschaft» in «Landwirtschaft» dürfen NICHT greifen
    expect(mapCategory({ name: 'Barcelona Sants', railway: 'station' })).toBe('transport');
    expect(mapCategory({ name: 'Landwirtschaftsmuseum' })).toBe('public');
    expect(mapCategory({ name: 'Bari Centrale', railway: 'station' })).toBe('transport');
  });

  it('gibt Gastronomie Vorrang vor Transport (Restaurant-WC im Bahnhof)', () => {
    expect(mapCategory({ access: 'customers', location: 'station' })).toBe('gastronomy');
    // auch rein namensbasiert
    expect(mapCategory({ name: 'Bahnhofrestaurant', railway: 'station' })).toBe('gastronomy');
  });

  it('erkennt Mall und Nette Toilette', () => {
    expect(mapCategory({ shop: 'mall' })).toBe('mall');
    expect(mapCategory({ 'toilets:scheme': 'nette_toilette' })).toBe('nette_toilette');
  });

  it('fällt auf public zurück', () => {
    expect(mapCategory({ amenity: 'toilets' })).toBe('public');
    expect(mapCategory({})).toBe('public');
  });
});

describe('resolveCategory (Phasen-Hint)', () => {
  it('wendet Nähe-Hint nur auf unklassifizierte (public) Toiletten an', () => {
    // Bahnhofs-Nähe macht eine generische Toilette zu Transport
    expect(resolveCategory({ amenity: 'toilets' }, 'transport')).toBe('transport');
  });

  it('überschreibt erkannte Restaurant-Toiletten NICHT durch Bahnhofs-Nähe', () => {
    // Kernregression: Restaurant im 500-m-Umkreis eines Bahnhofs bleibt Gastronomie
    expect(resolveCategory({ access: 'customers' }, 'transport')).toBe('gastronomy');
    expect(resolveCategory({ amenity: 'restaurant' }, 'transport')).toBe('gastronomy');
  });

  it('überschreibt Shop-Toiletten nicht durch Mall-Nähe', () => {
    expect(resolveCategory({ shop: 'bakery' }, 'mall')).toBe('mall'); // shop→mall ohnehin
    expect(resolveCategory({ access: 'customers' }, 'mall')).toBe('gastronomy');
  });

  it('lässt den präzisen nette_toilette-Hint immer gewinnen', () => {
    expect(resolveCategory({ amenity: 'toilets' }, 'nette_toilette')).toBe('nette_toilette');
  });

  it('ohne Hint = natürliche Kategorie', () => {
    expect(resolveCategory({ amenity: 'restaurant' })).toBe('gastronomy');
  });
});
