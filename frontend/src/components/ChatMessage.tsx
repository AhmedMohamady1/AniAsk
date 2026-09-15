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
          <img src="/speaking.png" alt="AniAsk" className="chat-avatar-img" />
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
 * Formatter that converts markdown text to rich HTML.
 * Handles:
 *   - Bullet lists (-, *, •)
 *   - List items with images -> .chat-media-item cards with .chat-thumb-img
 *   - Standalone images -> .chat-hero-img
 *   - [AniList](url) links in brackets -> .anilist-badge pills
 *   - Role tags (Character, Voice Actor, etc.) -> .chat-role-badge pills
 *   - **bold**, *italic*, general links, and line breaks
 */
function formatMessageContent(content: string): string {
  // 1. Escape HTML
  let html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Normalize bullet points: lines starting with -, *, or •
  html = html.replace(/^[•\-*]\s+(.+)$/gm, "<li>$1</li>");

  // 3. Group consecutive <li> into <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>\s*)+/g, (match) => {
    const clean = match.replace(/<\/li>\s+/g, "</li>");
    return `<ul>${clean}</ul>`;
  });

  // 4. Format list items containing images into rich media items
  html = html.replace(
    /<li>([\s\S]*?)!\[([^\]]*)\]\((https?:\/\/[^)]+)\)([\s\S]*?)<\/li>/g,
    (_match, before, alt, src, after) => {
      const text = `${before} ${after}`.trim();
      return `<li class="chat-media-item"><img src="${src}" alt="${alt}" class="chat-thumb-img" loading="lazy" /><div class="chat-media-body">${text}</div></li>`;
    }
  );

  // 5. Standalone images (hero posters for single anime overviews)
  html = html.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g,
    '<img src="$2" alt="$1" class="chat-hero-img" loading="lazy" />'
  );

  // 6. Role badges: (Character), (Voice Actor), (Main Character), (Supporting)
  html = html.replace(
    /\((Character|Voice Actor|Main Character|Supporting)\)/gi,
    '<span class="chat-role-badge">$1</span>'
  );

  // 7. Bold text: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 8. Italic text: *text*
  html = html.replace(/(?<!\w)\*([^*]+?)\*(?!\w)/g, "<em>$1</em>");

  // 9. AniList links: [AniList](url) or ([AniList](url))
  html = html.replace(
    /\(?\[AniList\]\((https?:\/\/[^)]+)\)\)?/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="anilist-badge"><span class="anilist-badge-icon">AL</span><span class="anilist-badge-text">AniList</span><span class="anilist-badge-arrow">↗</span></a>'
  );

  // 10. General markdown links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // 11. Bare URLs (not already inside href="..." or src="...")
  html = html.replace(
    /(?<!["=>])(https?:\/\/[^\s<)]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // 12. Clean up newlines inside <ul> and format remaining line breaks
  html = html.replace(/<ul>[\s\S]*?<\/ul>/g, (ul) => ul.replace(/\n+/g, ""));
  html = html.replace(/\n{2,}/g, "<br><br>").replace(/\n/g, "<br>");

  // 13. Remove accidental spaces before punctuation (e.g. badge followed by " .")
  html = html.replace(/\s+([.,;:!?])/g, "$1");

  return html;
}
