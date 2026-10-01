/**
 * TypeScript type definitions for the AniAsk frontend.
 */

/** Message in the chat thread. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

/** A single message entry sent as history to the backend. */
export interface MessageEntry {
  role: "user" | "assistant";
  content: string;
}

/** Request body for POST /api/chat. */
export interface ChatRequest {
  message: string;
  history?: MessageEntry[];
}

/** Response body from POST /api/chat. */
export interface ChatResponse {
  reply: string;
  error?: string | null;
}

/** Response body from POST /api/summarize-title. */
export interface SummarizeTitleResponse {
  title: string;
}

/** A conversation stored in IndexedDB. */
export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  searchText: string;
}

/** A message stored in IndexedDB, linked to a conversation. */
export interface StoredMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/** Active navigation tab across the app. */
export type PageTab = "home" | "chatbot" | "mylist";

/** Anime Title object from AniList GraphQL / Express API. */
export interface AnimeTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
}

/** Anime Cover Image links from AniList. */
export interface AnimeCoverImage {
  large?: string | null;
  extraLarge?: string | null;
}

/** Anime start date. */
export interface AnimeStartDate {
  year?: number | null;
  month?: number | null;
  day?: number | null;
}

/** Anime Media item from backend endpoints. */
export interface AnimeMedia {
  id: number;
  title: AnimeTitle;
  coverImage?: AnimeCoverImage | null;
  bannerImage?: string | null;
  averageScore?: number | null;
  popularity?: number | null;
  trending?: number | null;
  episodes?: number | null;
  status?: string | null;
  format?: string | null;
  genres?: string[] | null;
  startDate?: AnimeStartDate | null;
  description?: string | null;
}

/** Pagination information returned by AniList queries. */
export interface AnimePageInfo {
  currentPage: number;
  hasNextPage: boolean;
  lastPage?: number;
  perPage: number;
  total?: number;
}

/** API response from /anime/trending, /anime/top-rated, and /anime/search. */
export interface AnimeListResponse {
  status: "success" | "fail";
  data: {
    pageInfo?: AnimePageInfo;
    media: AnimeMedia[];
  };
  message?: string;
}

/** Studio node representation from AniList. */
export interface AnimeStudioNode {
  id: number;
  name: string;
}

/** Studio edge representation from AniList. */
export interface AnimeStudioEdge {
  isMain?: boolean;
  node: AnimeStudioNode;
}

/** Studios container from AniList. */
export interface AnimeStudios {
  edges?: AnimeStudioEdge[];
}

/** Character name representation from AniList. */
export interface AnimeCharacterName {
  full: string;
  native?: string | null;
}

/** Character image representation from AniList. */
export interface AnimeCharacterImage {
  large?: string | null;
  medium?: string | null;
}

/** Character node representation from AniList. */
export interface AnimeCharacterNode {
  id: number;
  name: AnimeCharacterName;
  image?: AnimeCharacterImage | null;
}

/** Voice actor name representation from AniList. */
export interface AnimeVoiceActorName {
  full: string;
  native?: string | null;
}

/** Voice actor image representation from AniList. */
export interface AnimeVoiceActorImage {
  large?: string | null;
  medium?: string | null;
}

/** Voice actor representation from AniList. */
export interface AnimeVoiceActor {
  id: number;
  name: AnimeVoiceActorName;
  image?: AnimeVoiceActorImage | null;
}

/** Character edge with role and voice actors. */
export interface AnimeCharacterEdge {
  role?: string | null;
  node: AnimeCharacterNode;
  voiceActors?: AnimeVoiceActor[] | null;
}

/** Characters container from AniList. */
export interface AnimeCharacters {
  edges?: AnimeCharacterEdge[];
}

/** Detailed Anime information returned by /anime/:id. */
export interface AnimeDetails extends AnimeMedia {
  idMal?: number | null;
  season?: string | null;
  seasonYear?: number | null;
  duration?: number | null;
  meanScore?: number | null;
  countryOfOrigin?: string | null;
  endDate?: AnimeStartDate | null;
  studios?: AnimeStudios | null;
  characters?: AnimeCharacters | null;
}

/** Response from GET /anime/:id. */
export interface AnimeDetailsResponse {
  status: "success" | "fail";
  data: AnimeDetails;
  message?: string;
}

/** ── Authentication Types ── */

export interface User {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface AuthResponse {
  success?: boolean;
  status?: string;
  message?: string;
  accessToken?: string;
  user?: User;
}

/** ── Tracking Types ── */

/** Backend snake_case format — matches Neon DB enum exactly. */
export type TrackingStatus =
  | "watching"
  | "completed"
  | "on_hold"
  | "dropped"
  | "planning";

/** Human-readable labels for each status. */
export const TRACKING_STATUS_LABELS: Record<TrackingStatus, string> = {
  watching:  "Watching",
  completed: "Completed",
  on_hold:   "On Hold",
  dropped:   "Dropped",
  planning:  "Planning",
};

/** Material icon for each status. */
export const TRACKING_STATUS_ICONS: Record<TrackingStatus, string> = {
  watching:  "play_circle",
  completed: "check_circle",
  on_hold:   "pause_circle",
  dropped:   "cancel",
  planning:  "bookmark",
};

/** CSS class suffix for each status badge color. */
export const TRACKING_STATUS_COLORS: Record<TrackingStatus, string> = {
  watching:  "watching",
  completed: "completed",
  on_hold:   "onhold",
  dropped:   "dropped",
  planning:  "planning",
};

/**
 * A single anime tracking entry — stored in localStorage as a local cache
 * and synced with the backend on every save/remove.
 */
export interface TrackingEntry {
  animeId: number;
  status: TrackingStatus;
  /**
   * Score as displayed in UI: 1–10 (stars).
   * Sent to backend as ratings = score * 10  (0–100 scale).
   * null = not rated.
   */
  score: number | null;
  review: string;
  updatedAt: string; // ISO date string
}

/** Convert 1–10 star score → 0–100 backend rating. */
export function scoreToRating(score: number | null): number | undefined {
  return score !== null && score !== undefined ? score * 10 : undefined;
}

/** Convert 0–100 backend rating → 1–10 star score. */
export function ratingToScore(rating: number | null | undefined): number | null {
  if (rating === null || rating === undefined) return null;
  return Math.round(rating / 10);
}


