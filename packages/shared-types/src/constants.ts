export const CATEGORY_LABELS: Record<string, string> = {
  public: 'Öffentlich',
  nette_toilette: 'Nette Toilette',
  gastronomy: 'Gastronomie',
  transport: 'Bahnhof / Transit',
  mall: 'Einkaufszentrum',
  event: 'Event',
  private: 'Privat',
};

export const CATEGORY_EMOJI: Record<string, string> = {
  public: '🚻',
  nette_toilette: '🎀',
  gastronomy: '🍽️',
  transport: '🚉',
  mall: '🛍️',
  event: '🎉',
  private: '🔒',
};

// Brand-Farben (Light-Theme als Default)
export const COLORS = {
  brandPrimary: '#FF6B35',
  brandSecondary: '#FFD23F',
  brandDeep: '#0B132B',
  brandMint: '#06D6A0',
  brandBerry: '#EF476F',
  brandSky: '#118AB2',
  paper: '#FFFBF2',
  cream: '#FFF3DC',
  surface: '#FFFFFF',
  ink: '#0B132B',
  muted: '#6B7280',
  line: '#E7E0CF',
  rateFlower: '#E91E63',
  rateFlowerBg: '#FFE4EE',
  rateFly: '#374151',
  rateFlyBg: '#F3F4F6',
} as const;

export const COLORS_DARK = {
  ...COLORS,
  brandPrimary: '#FF8B5C',
  brandSecondary: '#FFE066',
  brandMint: '#3FE8B7',
  brandBerry: '#FF6B8A',
  paper: '#0E1117',
  cream: '#1F2630',
  surface: '#161B22',
  ink: '#F4EFE6',
  muted: '#9AA4B2',
  line: '#2A313C',
  rateFlower: '#FF7AB3',
  rateFlowerBg: '#3A1929',
  rateFly: '#9AA4B2',
  rateFlyBg: '#1F2630',
} as const;
