const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

export type Score = { flowers: number; flies: number; net: number; count: number };

export interface ToiletAccessibility {
  wheelchair?: boolean;
  step_free?: boolean;
  baby_changing?: boolean;
  gender_neutral?: boolean;
  euro_key?: boolean;
  shower?: boolean;
}

export interface Toilet {
  id: string;
  name: string;
  category: string;
  longitude: number;
  latitude: number;
  address?: string;
  feeChf?: number;
  visibility: string;
  status: string;
  distanceM?: number;
  score?: Score;
  accessibility?: ToiletAccessibility;
  verified?: boolean;
  _count?: { ratings: number };
}

export interface Rating {
  id: string;
  toiletId: string;
  userId: string;
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
  s3Key: string;
  moderationStatus: string;
  createdAt: string;
  url?: string;
}

function token(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('klo-access') ?? null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const t = token();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (t) headers['Authorization'] = `Bearer ${t}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message ?? 'API error'), { status: res.status });
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  /** Sendet den Magic Link und gibt die sessionId für Cross-Device-Polling zurück. */
  requestMagicLink: (email: string): Promise<{ message: string; sessionId: string }> =>
    request('/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) }),

  verify: (tok: string): Promise<{ accessToken: string }> =>
    request(`/auth/verify?token=${encodeURIComponent(tok)}`),

  /** Pollt ob der Handy-Klick auf den Magic Link die Laptop-Session freigegeben hat. */
  poll: (sessionId: string): Promise<{ accessToken: string } | { pending: true }> =>
    request(`/auth/poll?sessionId=${encodeURIComponent(sessionId)}`),

  refresh: (): Promise<{ accessToken: string }> => request('/auth/refresh', { method: 'POST' }),

  me: (): Promise<{ id: string; handle: string; email?: string; role: string }> =>
    request('/auth/me'),

  logout: () => request('/auth/logout', { method: 'POST' }),
};

// ── Toilets ───────────────────────────────────────────────────────────────────

export const toilets = {
  nearby: (lng: number, lat: number, radius = 2000, category?: string[]) => {
    const p = new URLSearchParams({ lng: String(lng), lat: String(lat), radius: String(radius) });
    if (category?.length) category.forEach((c) => p.append('category', c));
    return request<Toilet[]>(`/toilets?${p}`);
  },

  get: (id: string) =>
    request<Toilet & { ratings: Rating[]; photos: Photo[]; score: Score }>(`/toilets/${id}`),

  create: (data: {
    name: string;
    category: string;
    longitude: number;
    latitude: number;
    address?: string;
    feeChf?: number;
    visibility?: string;
  }) => request<Toilet>('/toilets', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserStats {
  points: number;
  toiletCount: number;
  ratingCount: number;
  photoCount: number;
}

export interface Badge {
  id: string;
  key: string;
  label: string;
  emoji: string;
  unlockedAt: string;
}

export const users = {
  me: () => request<{ id: string; handle: string; email?: string; role: string }>('/auth/me'),
  stats: (id: string) => request<UserStats>(`/users/${id}/stats`),
  myToilets: () => request<Toilet[]>('/users/me/toilets'),
  myBadges: () => request<Badge[]>('/users/me/badges'),
  publicProfile: (id: string) =>
    request<{ id: string; handle: string; role: string }>(`/users/${id}/profile`),
};

// ── Search ────────────────────────────────────────────────────────────────────

export const search = {
  query: (q: string, location?: { lat: number; lng: number }) => {
    const p = new URLSearchParams({ q });
    if (location) {
      p.set('lat', String(location.lat));
      p.set('lng', String(location.lng));
    }
    return request<{ q: string; results: Toilet[] }>(`/search?${p}`);
  },
};

// ── Ratings ───────────────────────────────────────────────────────────────────

export interface ScoreInput {
  flowers?: number;
  flies?: number;
}

export interface RatingInput {
  scores: {
    accessibility?: ScoreInput;
    cleanliness?: ScoreInput;
    hygiene?: ScoreInput;
    style?: ScoreInput;
    amenities?: ScoreInput;
    safety?: ScoreInput;
    inclusivity?: ScoreInput;
    cost?: ScoreInput;
    wait?: ScoreInput;
    kids?: ScoreInput;
  };
  comment?: string;
  language?: string;
}

export const ratings = {
  list: (toiletId: string, page = 1) =>
    request<{ items: Rating[]; total: number; pages: number }>(
      `/toilets/${toiletId}/ratings?page=${page}`,
    ),

  upsert: (toiletId: string, data: RatingInput) =>
    request<{ rating: Rating; score: Score }>(`/toilets/${toiletId}/ratings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  mine: (toiletId: string) => request<Rating>(`/toilets/${toiletId}/ratings/mine`),

  remove: (toiletId: string) => request(`/toilets/${toiletId}/ratings/mine`, { method: 'DELETE' }),
};

// ── Media ─────────────────────────────────────────────────────────────────────

export const media = {
  upload: async (file: File, toiletId: string, ratingId?: string) => {
    const t = token();
    const form = new FormData();
    form.append('file', file);
    const p = new URLSearchParams({ toiletId });
    if (ratingId) p.set('ratingId', ratingId);
    const headers: Record<string, string> = {};
    if (t) headers['Authorization'] = `Bearer ${t}`;
    const res = await fetch(`${BASE}/media/upload?${p}`, {
      method: 'POST',
      body: form,
      headers,
      credentials: 'include',
    });
    if (!res.ok) throw new Error((await res.json()).message ?? 'Upload failed');
    return res.json() as Promise<Photo & { url: string }>;
  },

  delete: (photoId: string) => request(`/media/${photoId}`, { method: 'DELETE' }),

  url: (s3Key: string) =>
    `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL ?? 'http://localhost:9010/klopilot-media'}/${s3Key}`,
};

// ── Moderation (Admin) ────────────────────────────────────────────────────────

export interface PendingPhoto {
  id: string;
  s3Key: string;
  moderationStatus: string;
  createdAt: string;
  toilet: { id: string; name: string };
  user: { id: string; handle: string };
}

export interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { id: string; handle: string; email: string };
}

export const moderation = {
  photos: (page = 1): Promise<{ items: PendingPhoto[]; total: number }> =>
    request(`/moderation/photos?page=${page}`),

  approvePhoto: (id: string) => request(`/moderation/photos/${id}/approve`, { method: 'PATCH' }),

  rejectPhoto: (id: string) => request(`/moderation/photos/${id}/reject`, { method: 'PATCH' }),

  reports: (status = 'open', page = 1): Promise<{ items: Report[]; total: number }> =>
    request(`/moderation/queue?status=${status}&page=${page}`),

  resolveReport: (id: string, status: 'resolved' | 'dismissed') =>
    request(`/moderation/queue/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ── Heatmap ───────────────────────────────────────────────────────────────────

export interface HeatmapPoint {
  lng: number;
  lat: number;
  weight?: number;
}

export const heatmap = {
  get: () => request<{ points: HeatmapPoint[] }>('/heatmap'),
};
