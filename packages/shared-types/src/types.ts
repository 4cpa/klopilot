export type Score = {
  flowers: number;
  flies: number;
  net: number;
  count: number;
};

export type UserRole = 'anon' | 'user' | 'verified' | 'moderator' | 'admin';

export interface User {
  id: string;
  handle: string;
  email?: string;
  role: UserRole;
  locale: string;
}

export type ToiletCategory =
  | 'public'
  | 'nette_toilette'
  | 'gastronomy'
  | 'transport'
  | 'mall'
  | 'event'
  | 'private';

export type Visibility = 'public' | 'nette_toilette' | 'private';
export type ToiletStatus = 'active' | 'hidden' | 'removed';

export interface Partner {
  id: string;
  name: string;
  type: string;
  website?: string | null;
  logoKey?: string | null;
  description?: string | null;
  verified: boolean;
}

export interface Toilet {
  id: string;
  name: string;
  category: ToiletCategory;
  longitude: number;
  latitude: number;
  address?: string;
  feeChf?: number | null;
  visibility: Visibility;
  status: ToiletStatus;
  verified: boolean;
  partner?: Pick<Partner, 'id' | 'name' | 'type' | 'logoKey'> | null;
  openingHours?: OpeningHours | null;
  accessibility?: Accessibility | null;
  distanceM?: number;
  score?: Score;
  _count?: { ratings: number };
}

export interface Accessibility {
  wheelchair?: boolean;
  baby_changing?: boolean;
  euro_key?: boolean;
  gender_neutral?: boolean;
  step_free?: boolean;
  shower?: boolean;
}

export type DayKey = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';
export type DayHours = { open: string; close: string } | null;
export type OpeningHours = Partial<Record<DayKey, DayHours>>;

export type CriterionKey =
  | 'accessibility'
  | 'cleanliness'
  | 'hygiene'
  | 'style'
  | 'amenities'
  | 'safety'
  | 'inclusivity'
  | 'cost'
  | 'wait'
  | 'kids';

export interface ScoreInput {
  flowers?: number;
  flies?: number;
}

export type ScoresMap = Partial<Record<CriterionKey, ScoreInput>>;

export interface RatingInput {
  scores: ScoresMap;
  comment?: string;
  language?: string;
}

export interface Rating {
  id: string;
  toiletId: string;
  userId: string;
  user?: { handle: string };
  comment?: string;
  language: string;
  createdAt: string;
  flowersAccessibility: number;
  fliesAccessibility: number;
  flowersCleanliness: number;
  fliesCleanliness: number;
  flowersHygiene: number;
  fliesHygiene: number;
  flowersStyle: number;
  fliesStyle: number;
  flowersAmenities: number;
  fliesAmenities: number;
  flowersSafety: number;
  fliesSafety: number;
  flowersInclusivity: number;
  fliesInclusivity: number;
  flowersCost: number;
  fliesCost: number;
  flowersWait: number;
  fliesWait: number;
  flowersKids: number;
  fliesKids: number;
}

export interface Photo {
  id: string;
  toiletId: string;
  s3Key: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  url?: string;
}
