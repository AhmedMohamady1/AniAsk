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

