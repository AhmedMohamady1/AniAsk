/**
 * Custom React hook for managing chat state.
 *
 * Integrates with the conversation persistence layer so messages
 * are saved to IndexedDB and history is sent to the backend.
 */

import { useCallback, useState } from "react";
import { sendChatMessage } from "../api/chat";
import type { ChatMessage, MessageEntry } from "../types";

/** Max number of history messages to send to the backend. */
const MAX_HISTORY_MESSAGES = 20;

/** Generate a simple unique ID for messages. */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface UseChatOptions {
  activeConversationId: string | null;
  createConversation: () => Promise<string>;
  saveMessage: (msg: ChatMessage, conversationId: string) => Promise<void>;
  generateTitle: (conversationId: string, messages: ChatMessage[]) => Promise<void>;
}

export function useChat({
  activeConversationId,
  createConversation,
  saveMessage,
  generateTitle,
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Determine the conversation ID — create a new one if needed
    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation();
    }

    // 1. Add user message immediately (optimistic update)
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    // 2. Add a placeholder for the assistant's response
    const assistantPlaceholder: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsLoading(true);

    // Save user message to IndexedDB
    await saveMessage(userMessage, convId);

    // Build history from current messages (before this exchange)
    const currentMessages = [...messages, userMessage];
    const history: MessageEntry[] = currentMessages
      .slice(-MAX_HISTORY_MESSAGES)
      .filter((m) => !m.isLoading)
      .map((m) => ({ role: m.role, content: m.content }));

    // Remove the current message from history (it's sent as the main message)
    const historyWithoutCurrent = history.slice(0, -1);

    try {
      const response = await sendChatMessage(content.trim(), historyWithoutCurrent);

      const assistantMessage: ChatMessage = {
        ...assistantPlaceholder,
        content: response.reply,
        isLoading: false,
      };

      // 3. Replace the placeholder with the real response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholder.id ? assistantMessage : msg
        )
      );

      // Save assistant message to IndexedDB
      await saveMessage(assistantMessage, convId);

      // Generate title after the first exchange (user + assistant)
      const allMessages = [...currentMessages, assistantMessage];
      if (allMessages.filter((m) => m.role === "user").length === 1) {
        generateTitle(convId, allMessages);
      }
    } catch (error) {
      // Replace placeholder with error message
      const errorText =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";

      const errorMessage: ChatMessage = {
        ...assistantPlaceholder,
        content: `⚠️ Error: ${errorText}`,
        isLoading: false,
      };

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholder.id ? errorMessage : msg
        )
      );

      // Still save error message so the conversation makes sense
      await saveMessage(errorMessage, convId);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeConversationId, createConversation, saveMessage, generateTitle, messages]);

  /** Load existing messages into the chat (when switching conversations). */
  const setExistingMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    setExistingMessages,
  };
}

