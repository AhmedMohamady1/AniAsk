/**
 * Hook for managing conversation persistence in IndexedDB.
 *
 * Handles creating, loading, saving, deleting, and searching conversations.
 */

import { useCallback, useEffect, useState } from "react";
import { summarizeTitle } from "../api/chat";
import { db } from "../db/db";
import { searchConversations as tfidfSearch } from "../db/search";
import type {
  ChatMessage,
  Conversation,
  MessageEntry,
  StoredMessage,
} from "../types";

/** Generate a simple unique ID. */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Format a relative timestamp like "2 hours ago". */
export function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  // Load all conversations on mount (sorted by updatedAt desc)
  const refreshConversations = useCallback(async () => {
    const all = await db.conversations.orderBy("updatedAt").reverse().toArray();
    setConversations(all);
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  /** Create a new empty conversation and set it as active. */
  const createConversation = useCallback(async (): Promise<string> => {
    const id = generateId();
    const now = new Date();
    const conversation: Conversation = {
      id,
      title: "New Conversation",
      createdAt: now,
      updatedAt: now,
      searchText: "",
    };
    await db.conversations.add(conversation);
    setActiveConversationId(id);
    await refreshConversations();
    return id;
  }, [refreshConversations]);

  /** Load all messages for a specific conversation. */
  const loadConversation = useCallback(
    async (id: string): Promise<ChatMessage[]> => {
      setActiveConversationId(id);
      const stored = await db.messages
        .where("conversationId")
        .equals(id)
        .toArray();

      // Sort by timestamp ascending.
      // For messages with identical timestamps (common in older stored data where user
      // and assistant messages were created in the same millisecond), ensure the user
      // message always precedes the assistant response.
      stored.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        const timeDiff = timeA - timeB;
        if (timeDiff !== 0) return timeDiff;
        if (a.role !== b.role) {
          return a.role === "user" ? -1 : 1;
        }
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      return stored.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));
    },
    []
  );

  /** Save a message to the active conversation in IndexedDB. */
  const saveMessage = useCallback(
    async (msg: ChatMessage, conversationId: string) => {
      const stored: StoredMessage = {
        id: msg.id,
        conversationId,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      };
      await db.messages.put(stored);

      // Update the conversation's updatedAt and searchText
      const conversation = await db.conversations.get(conversationId);
      if (conversation) {
        const allMessages = await db.messages
          .where("conversationId")
          .equals(conversationId)
          .toArray();
        const searchText = allMessages.map((m) => m.content).join(" ");

        await db.conversations.update(conversationId, {
          updatedAt: new Date(),
          searchText,
        });
      }

      await refreshConversations();
    },
    [refreshConversations]
  );

  /** Delete a conversation and all its messages. */
  const deleteConversation = useCallback(
    async (id: string) => {
      await db.messages.where("conversationId").equals(id).delete();
      await db.conversations.delete(id);

      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      await refreshConversations();
    },
    [activeConversationId, refreshConversations]
  );

  /** Search conversations using TF-IDF similarity. */
  const searchConversationsFn = useCallback(
    async (query: string): Promise<Conversation[]> => {
      if (!query.trim()) {
        return conversations;
      }

      const corpus = conversations.map((c) => ({
        id: c.id,
        text: `${c.title} ${c.searchText}`,
      }));

      const results = tfidfSearch(query, corpus);
      const idOrder = new Map(results.map((r, i) => [r.conversationId, i]));

      return conversations
        .filter((c) => idOrder.has(c.id))
        .sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));
    },
    [conversations]
  );

  /** Generate a title for a conversation from its first messages. */
  const generateTitle = useCallback(
    async (conversationId: string, messages: ChatMessage[]) => {
      // Take the first 3 messages for summarization
      const firstMessages: MessageEntry[] = messages
        .slice(0, 3)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const title = await summarizeTitle(firstMessages);
        await db.conversations.update(conversationId, { title });
        await refreshConversations();
      } catch {
        // Fallback: use first user message
        const firstUserMsg = messages.find((m) => m.role === "user");
        const fallbackTitle =
          firstUserMsg?.content.slice(0, 50) || "New Conversation";
        await db.conversations.update(conversationId, { title: fallbackTitle });
        await refreshConversations();
      }
    },
    [refreshConversations]
  );

  /** Start a new chat — just clear the active conversation ID (don't delete the old one). */
  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  return {
    conversations,
    activeConversationId,
    createConversation,
    loadConversation,
    saveMessage,
    deleteConversation,
    searchConversations: searchConversationsFn,
    generateTitle,
    startNewChat,
  };
}
