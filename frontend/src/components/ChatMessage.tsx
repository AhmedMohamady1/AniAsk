import type { ChatMessage as ChatMessageType } from "../types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`chat-message ${isUser ? "chat-message-user" : "chat-message-assistant"}`}>
      {!isUser && (
        <div className="chat-avatar">
          <span className="material-symbols-outlined">smart_toy</span>
        </div>
      )}
      <div className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-assistant"}`}>
        {message.isLoading ? (
          <div className="chat-loading">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
        ) : (
          <div
            className="chat-content"
            /* Render markdown-style line breaks */
            dangerouslySetInnerHTML={{
              __html: formatMessageContent(message.content),
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Simple formatter that converts markdown-like text to basic HTML.
 * Handles: **bold**, line breaks, bullet lists, and links.
 */
function formatMessageContent(content: string): string {
  return content
    // Escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic: *text*
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links: [text](url)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    // Bare URLs (skip ones already inside href="...")
    .replace(
      /(?<!["=(])(https?:\/\/[^\s<)]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    // Bullet lists: lines starting with - or •
    .replace(/^[•\-]\s+(.+)$/gm, "<li>$1</li>")
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    // Line breaks
    .replace(/\n/g, "<br>");
}
