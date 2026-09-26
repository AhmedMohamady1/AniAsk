/**
 * API client for interacting with AniAsk backend anime endpoints.
 * Powered by AniList GraphQL integration through Express backend.
 */

import type {
  AnimeDetails,
  AnimeDetailsResponse,
  AnimeListResponse,
  AnimeMedia,
} from "../types";

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "https://aniask.onrender.com";

/**
 * Fetch top trending anime.
 *
 * @param limit - Number of anime to return (default 5).
 */
export async function getTrendingAnime(limit = 5): Promise<AnimeMedia[]> {
  const url = `${BACKEND_BASE_URL}/anime/trending?page=1&perPage=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Failed to fetch trending anime: ${response.status} ${response.statusText}`
    );
  }

  const data: AnimeListResponse = await response.json();
  return data.data?.media || [];
}

/**
 * Fetch top highest rated anime.
 *
 * @param limit - Number of anime to return (default 5).
 */
export async function getTopRatedAnime(limit = 5): Promise<AnimeMedia[]> {
  const url = `${BACKEND_BASE_URL}/anime/top-rated?page=1&perPage=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Failed to fetch top rated anime: ${response.status} ${response.statusText}`
    );
  }

  const data: AnimeListResponse = await response.json();
  return data.data?.media || [];
}

/**
 * Search anime by title or keyword.
 *
 * @param query - Keyword or title to search.
 * @param limit - Number of results to return (default 10).
 */
export async function searchAnime(
  query: string,
  limit = 10
): Promise<AnimeMedia[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${BACKEND_BASE_URL}/anime/search?q=${encodeURIComponent(
    trimmed
  )}&page=1&perPage=${limit}`;
  const response = await fetch(url);

  // When no matches are found, backend returns 404 with { status: "fail", message: "..." }
  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Failed to search anime: ${response.status} ${response.statusText}`
    );
  }

  const data: AnimeListResponse = await response.json();
  return data.data?.media || [];
}

/**
 * Fetch full details for a specific anime by its AniList numeric ID.
 *
 * @param id - AniList media identifier.
 */
export async function getAnimeDetails(id: number): Promise<AnimeDetails> {
  const url = `${BACKEND_BASE_URL}/anime/${id}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Failed to fetch anime details: ${response.status} ${response.statusText}`
    );
  }

  const data: AnimeDetailsResponse = await response.json();
  return data.data;
}
