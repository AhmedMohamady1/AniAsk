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

/** Request body for POST /api/chat. */
export interface ChatRequest {
  message: string;
}

/** Response body from POST /api/chat. */
export interface ChatResponse {
  reply: string;
  error?: string | null;
}
