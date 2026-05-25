import * as SecureStore from 'expo-secure-store';
import type {
  Toilet,
  Rating,
  RatingInput,
  Score,
  Photo,
  User,
  Partner,
} from '@klopilot/shared-types';

export type { Toilet, Rating, RatingInput, Score, Photo, User, Partner };

// EXPO_PUBLIC_* Variablen werden zur Build-Zeit eingebettet
declare const process: { env: Record<string, string | undefined> };
const BASE = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3101';
const TOKEN_KEY = 'klo_access_token';
const REFRESH_KEY = 'klo_refresh_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function setToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}
export async function setRefreshToken(token: string) {
  await SecureStore.setItemAsync(REFRESH_KEY, token);
}
export async function clearRefreshToken() {
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

/** Verhindert parallele Refresh-Requests (Promise-Dedup). */
let _refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

async function doRefresh(): Promise<{ accessToken: string; refreshToken: string }> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    const rt = await getRefreshToken();
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt ?? undefined }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('refresh_failed');
    return res.json() as Promise<{ accessToken: string; refreshToken: string }>;
  })().finally(() => {
    _refreshPromise = null;
  });
  return _refreshPromise;
}

async function request<T>(path: string, init: RequestInit = {}, _retry = true): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' });

  // ── Token abgelaufen → einmal refreshen und Anfrage wiederholen ──────────
  if (res.status === 401 && _retry && path !== '/auth/refresh') {
    try {
      const { accessToken, refreshToken } = await doRefresh();
      await setToken(accessToken);
      await setRefreshToken(refreshToken);
      return request<T>(path, init, false); // kein weiterer Retry
    } catch {
      await clearToken();
      await clearRefreshToken();
      throw Object.assign(new Error('Session abgelaufen'), { status: 401 });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message ?? 'API error'), { status: res.status });
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  requestMagicLink: (email: string) =>
    request('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email, platform: 'mobile' }),
    }),

  verify: (tok: string): Promise<{ accessToken: string; refreshToken: string }> =>
    request(`/auth/verify?token=${encodeURIComponent(tok)}&mobile=true`),

  refresh: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const rt = await getRefreshToken();
    return request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: rt ?? undefined }),
    });
  },

  me: (): Promise<User> => request('/auth/me'),

  logout: () => request('/auth/logout', { method: 'POST' }),
};

// ── Toilets ───────────────────────────────────────────────────────────────────

export const toiletsApi = {
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
    openingHours?: import('@klopilot/shared-types').OpeningHours;
    accessibility?: import('@klopilot/shared-types').Accessibility;
  }) => request<Toilet>('/toilets', { method: 'POST', body: JSON.stringify(data) }),

  private: () => request<Toilet[]>('/toilets/private'),

  mine: () => request<Toilet[]>('/toilets/mine'),

  update: (
    id: string,
    data: {
      name?: string;
      category?: string;
      address?: string;
      feeChf?: number | null;
      visibility?: string;
      openingHours?: import('@klopilot/shared-types').OpeningHours | null;
      accessibility?: import('@klopilot/shared-types').Accessibility | null;
    },
  ) => request<Toilet>(`/toilets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  remove: (id: string) => request<void>(`/toilets/${id}`, { method: 'DELETE' }),

  verify: (id: string) => request<Toilet>(`/toilets/${id}/verify`, { method: 'PATCH' }),
  unverify: (id: string) => request<Toilet>(`/toilets/${id}/unverify`, { method: 'PATCH' }),

  invite: (toiletId: string, email: string) =>
    request(`/toilets/${toiletId}/invites`, { method: 'POST', body: JSON.stringify({ email }) }),

  listInvites: (toiletId: string) =>
    request<{ invitee: { id: string; handle: string; email?: string }; grantedAt: string }[]>(
      `/toilets/${toiletId}/invites`,
    ),

  removeInvite: (toiletId: string, inviteeId: string) =>
    request(`/toilets/${toiletId}/invites/${inviteeId}`, { method: 'DELETE' }),
};

// ── Ratings ───────────────────────────────────────────────────────────────────

export const ratingsApi = {
  upsert: (toiletId: string, data: RatingInput) =>
    request<{ rating: Rating; score: Score }>(`/toilets/${toiletId}/ratings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  mine: (toiletId: string) => request<Rating>(`/toilets/${toiletId}/ratings/mine`),

  remove: (toiletId: string) => request(`/toilets/${toiletId}/ratings/mine`, { method: 'DELETE' }),
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportsApi = {
  create: (targetType: 'toilet' | 'rating' | 'photo' | 'user', targetId: string, reason: string) =>
    request('/reports', { method: 'POST', body: JSON.stringify({ targetType, targetId, reason }) }),
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  registerToken: (token: string) =>
    request('/notifications/token', { method: 'PATCH', body: JSON.stringify({ token }) }),
};

// ── Gamification ─────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  emoji: string;
  name: string;
}
export interface UserStats {
  points: number;
  toiletsCreated: number;
  ratingsGiven: number;
  photosApproved: number;
  verifiedToilets: number;
  badges: Badge[];
}
export interface LeaderboardEntry {
  rank: number;
  id: string;
  handle: string;
  points: number;
  badges: Badge[];
}

export interface PublicProfile {
  id: string;
  handle: string;
  role: string;
}

export const usersApi = {
  getPublicProfile: (id: string) => request<PublicProfile>(`/users/${id}/profile`),
  getStats: (id: string) => request<UserStats>(`/users/${id}/stats`),
};

export const gamificationApi = {
  myStats: () => request<UserStats>('/users/me/stats'),
  leaderboard: () => request<LeaderboardEntry[]>('/users/leaderboard'),
};

// ── Heatmap ───────────────────────────────────────────────────────────────────

export interface HeatCell {
  lng: number;
  lat: number;
  cellW: number;
  cellH: number;
  count: number;
}

export const heatmapApi = {
  fetch: (minLng: number, minLat: number, maxLng: number, maxLat: number) =>
    request<{ cells: HeatCell[] }>(
      `/heatmap?minLng=${minLng}&minLat=${minLat}&maxLng=${maxLng}&maxLat=${maxLat}&grid=8`,
    ),
};

// ── Partners ──────────────────────────────────────────────────────────────────

export interface PartnerDetail extends Partner {
  contactEmail?: string | null;
  createdAt: string;
  toilets: Pick<Toilet, 'id' | 'name' | 'category' | 'latitude' | 'longitude' | 'verified'>[];
}

export const partnersApi = {
  list: () => request<PartnerDetail[]>('/partners'),
  get: (id: string) => request<PartnerDetail>(`/partners/${id}`),
  apply: (data: {
    name: string;
    type?: string;
    website?: string;
    contactEmail?: string;
    description?: string;
  }) =>
    request<{ id: string; name: string; verified: boolean }>('/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Search ────────────────────────────────────────────────────────────────────

export const searchApi = {
  search: (
    q: string,
    category?: string[],
    location?: { latitude: number; longitude: number },
  ): Promise<{ q: string; results: Toilet[] }> => {
    const p = new URLSearchParams({ q });
    category?.forEach((c) => p.append('category', c));
    if (location) {
      p.set('lat', String(location.latitude));
      p.set('lng', String(location.longitude));
    }
    return request(`/search?${p}`);
  },
};

// ── Media ─────────────────────────────────────────────────────────────────────

const S3_PUBLIC =
  process.env['EXPO_PUBLIC_S3_PUBLIC_URL'] ?? 'http://localhost:9010/klopilot-media';

export const mediaApi = {
  upload: async (uri: string, mimeType: string, toiletId: string, ratingId?: string) => {
    const token = await getToken();
    const form = new FormData();
    form.append('file', { uri, name: 'photo.jpg', type: mimeType } as any);
    const p = new URLSearchParams({ toiletId });
    if (ratingId) p.set('ratingId', ratingId);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}/media/upload?${p}`, {
      method: 'POST',
      body: form,
      headers,
    });
    if (!res.ok) throw new Error((await res.json()).message ?? 'Upload failed');
    return res.json() as Promise<Photo & { url: string }>;
  },

  url: (s3Key: string) => `${S3_PUBLIC}/${s3Key}`,
};
