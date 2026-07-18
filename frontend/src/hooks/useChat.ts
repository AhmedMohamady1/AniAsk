/**
 * Custom React hook for managing chat state.
 */

import { useCallback, useState } from "react";
import { sendChatMessage } from "../api/chat";
import type { ChatMessage } from "../types";

/** Generate a simple unique ID for messages. */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

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

    try {
      const response = await sendChatMessage(content.trim());

      // 3. Replace the placeholder with the real response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholder.id
            ? { ...msg, content: response.reply, isLoading: false }
            : msg
        )
      );
    } catch (error) {
      // Replace placeholder with error message
      const errorText =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholder.id
            ? { ...msg, content: `⚠️ Error: ${errorText}`, isLoading: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
