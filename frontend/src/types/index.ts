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

