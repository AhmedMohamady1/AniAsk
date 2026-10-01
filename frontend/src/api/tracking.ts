/**
 * API client for the AniAsk tracking endpoints.
 * Backend: Node/Express + Drizzle + Neon DB — runs on port 4000 (proxied by Vite).
 *
 * Status values (backend snake_case):
 *   "watching" | "completed" | "on_hold" | "dropped" | "planning"
 *
 * Rating scale:
 *   Frontend stars: 1–10
 *   Backend ratings: 0–100  (multiply by 10 when sending, divide by 10 when receiving)
 */

import type { TrackingStatus } from "../types";

// ── Response shapes ──────────────────────────────────────────────────────────

export interface TrackingApiEntry {
  id: string;
  userId: string;
  animeId: number;
  status: TrackingStatus;
  ratings: number | null;   // 0–100
  reviews: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingListItem {
  anime: {
    id: number;
    title: { romaji?: string | null; english?: string | null; native?: string | null };
    coverImage?: { large?: string | null; extraLarge?: string | null } | null;
    averageScore?: number | null;
    episodes?: number | null;
    format?: string | null;
    status?: string | null;
  } | null;
  tracking: {
    id: string;
    status: TrackingStatus;
    ratings: number | null;
    reviews: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface TrackingPageInfo {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
  hasNextPage: boolean;
}

/** Shape returned by GET /tracking/:animeId/reviews */
export interface AnimeReview {
  id: string;
  animeId: number;
  username: string | null;
  status: TrackingStatus;
  ratings: number | null;   // 0–100
  reviews: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /tracking/:animeId/average-rating */
export interface AnimeAverageRating {
  animeId: number;
  /** Drizzle avg() returns a string or null */
  averageRating: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string" && data.message.trim()) return data.message;
    if (typeof data?.error?.message === "string") return data.error.message;
  } catch { /* not JSON */ }
  return `Request failed: ${res.status} ${res.statusText}`;
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

// ── Endpoints ────────────────────────────────────────────────────────────────

/**
 * POST /tracking
 * Create a new tracking entry for an anime. Requires auth.
 */
export async function createTrackingApi(
  payload: {
    animeId: number;
    status: TrackingStatus;
    ratings?: number;   // 0–100
    reviews?: string;
  },
  accessToken: string
): Promise<TrackingApiEntry[]> {
  const res = await fetch("/tracking", {
    method: "POST",
    headers: authHeaders(accessToken),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.data;
}

/**
 * PATCH /tracking/:animeId
 * Update an existing tracking entry. Requires auth.
 * At least one of status or ratings must be provided.
 */
export async function updateTrackingApi(
  animeId: number,
  payload: {
    status?: TrackingStatus;
    ratings?: number;   // 0–100
    reviews?: string;
  },
  accessToken: string
): Promise<TrackingApiEntry> {
  const res = await fetch(`/tracking/${animeId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.data;
}

/**
 * DELETE /tracking/:animeId
 * Remove tracking entry. Requires auth.
 */
export async function deleteTrackingApi(
  animeId: number,
  accessToken: string
): Promise<void> {
  const res = await fetch(`/tracking/${animeId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
}

/**
 * GET /tracking
 * Fetch the authenticated user's tracking list. Requires auth.
 */
export async function getUserTrackingApi(
  params: {
    status?: TrackingStatus;
    page?: number;
    perPage?: number;
  },
  accessToken: string
): Promise<{ data: TrackingListItem[]; pageInfo: TrackingPageInfo }> {
  const q = new URLSearchParams();
  if (params.status)  q.set("status", params.status);
  if (params.page)    q.set("page", String(params.page));
  if (params.perPage) q.set("perPage", String(params.perPage));

  const res = await fetch(`/tracking?${q.toString()}`, {
    method: "GET",
    headers: authHeaders(accessToken),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
  const json = await res.json();
  return { data: json.data, pageInfo: json.pageInfo };
}

/**
 * GET /tracking/:animeId/reviews  (PUBLIC — no auth needed)
 * Returns all tracking entries that have a review text for this anime.
 */
export async function getAnimeReviewsApi(animeId: number): Promise<AnimeReview[]> {
  const res = await fetch(`/tracking/${animeId}/reviews`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
  const json = await res.json();
  return json.data as AnimeReview[];
}

/**
 * GET /tracking/:animeId/average-rating  (PUBLIC — no auth needed)
 * Returns the average rating (0–100 scale) across all users.
 */
export async function getAnimeAverageRatingApi(
  animeId: number
): Promise<AnimeAverageRating> {
  const res = await fetch(`/tracking/${animeId}/average-rating`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
  const json = await res.json();
  return json.data as AnimeAverageRating;
}

/**
 * Upsert helper — tries PATCH first; if 404 falls back to POST.
 * Use this from the UI so you don't need to track whether an entry exists.
 */
export async function upsertTrackingApi(
  payload: {
    animeId: number;
    status: TrackingStatus;
    ratings?: number;
    reviews?: string;
  },
  accessToken: string
): Promise<TrackingApiEntry | TrackingApiEntry[]> {
  try {
    return await updateTrackingApi(
      payload.animeId,
      { status: payload.status, ratings: payload.ratings, reviews: payload.reviews },
      accessToken
    );
  } catch (err) {
    // If not found (first time tracking), create instead
    if (err instanceof Error && err.message.toLowerCase().includes("not found")) {
      return await createTrackingApi(payload, accessToken);
    }
    throw err;
  }
}
