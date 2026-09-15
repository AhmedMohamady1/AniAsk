/**
 * API client for communicating with the AniAsk backend.
 */

import type {
  ChatRequest,
  ChatResponse,
  MessageEntry,
  SummarizeTitleResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Send a chat message to the AniAsk agent and get a response.
 *
 * @param message - The current user message.
 * @param history - Optional conversation history for context.
 */
export async function sendChatMessage(
  message: string,
  history: MessageEntry[] = []
): Promise<ChatResponse> {
  const body: ChatRequest = { message, history };

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Server error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Generate a short summary title for a conversation.
 *
 * @param messages - The first few messages of the conversation.
 */
export async function summarizeTitle(
  messages: MessageEntry[]
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/summarize-title`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    // Fall back to first message content if summarization fails
    return messages[0]?.content.slice(0, 50) || "New Conversation";
  }

  const data: SummarizeTitleResponse = await response.json();
  return data.title;
}

/**
 * Check if the backend is healthy.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

