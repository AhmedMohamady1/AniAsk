import { useCallback, useEffect, useRef, useState } from "react";
import { relativeTime } from "../hooks/useConversations";
import type { Conversation } from "../types";

interface SidebarProps {
  onNewChat: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onSearch: (query: string) => Promise<Conversation[]>;
}

export default function Sidebar({
  onNewChat,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onSearch,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] =
    useState<Conversation[]>(conversations);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tick every 60s to keep relative timestamps ("2m ago") live
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Sync filtered list when conversations change (and no active search)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    }
  }, [conversations, searchQuery]);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim()) {
        setFilteredConversations(conversations);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const results = await onSearch(value);
        setFilteredConversations(results);
      }, 250);
    },
    [conversations, onSearch]
  );

  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();

      if (deletingId === id) {
        // Second click = confirm
        if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
        deleteTimerRef.current = null;
        setDeletingId(null);
        onDeleteConversation(id);
      } else {
        // First click = enter confirm state
        if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
        setDeletingId(id);
        deleteTimerRef.current = setTimeout(() => {
          setDeletingId(null);
        }, 3000);
      }
    },
    [deletingId, onDeleteConversation]
  );

  return (
    <nav className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <img src="/logo.png" alt="AniAsk Logo" className="sidebar-logo" />
        <div className="sidebar-brand-text">
          <h1 className="sidebar-title">AniAsk</h1>
          <p className="sidebar-subtitle">AI Anime Assistant</p>
        </div>
      </div>

      {/* New Chat Button */}
      <button className="new-chat-btn" onClick={onNewChat}>
        <span className="material-symbols-outlined">add_circle</span>
        New Chat
      </button>

      {/* Search */}
      <div className="sidebar-search">
        <span className="material-symbols-outlined sidebar-search-icon">
          search
        </span>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="sidebar-search-input"
        />
      </div>

      {/* Conversation List */}
      <div className="sidebar-section">
        <p className="sidebar-section-label">RECENT</p>

        {filteredConversations.length === 0 ? (
          <div className="sidebar-empty-state">
            <span className="material-symbols-outlined">
              chat_bubble_outline
            </span>
            <p>
              {searchQuery.trim()
                ? "No matching conversations"
                : "Your conversations will appear here"}
            </p>
          </div>
        ) : (
          <div className="conversation-list">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                className={`conversation-item ${
                  conv.id === activeConversationId
                    ? "conversation-item--active"
                    : ""
                }`}
                onClick={() => onSelectConversation(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectConversation(conv.id);
                  }
                }}
              >
                <div className="conversation-item-content">
                  <span className="conversation-item-title">{conv.title}</span>
                  <span className="conversation-item-time">
                    {relativeTime(conv.updatedAt)}
                  </span>
                </div>
                <button
                  type="button"
                  className={`conversation-delete-btn ${
                    deletingId === conv.id ? "conversation-delete-btn--confirm" : ""
                  }`}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleDelete(e, conv.id)}
                  title={deletingId === conv.id ? "Click again to confirm" : "Delete"}
                  aria-label={deletingId === conv.id ? "Confirm delete" : "Delete"}
                >
                  <span className="material-symbols-outlined">
                    {deletingId === conv.id ? "check" : "delete"}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

