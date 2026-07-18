interface SidebarProps {
  onNewChat: () => void;
}

export default function Sidebar({ onNewChat }: SidebarProps) {
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

      {/* Recent Chats */}
      <div className="sidebar-section">
        <p className="sidebar-section-label">RECENT</p>
        <div className="sidebar-empty-state">
          <span className="material-symbols-outlined">chat_bubble_outline</span>
          <p>Your conversations will appear here</p>
        </div>
      </div>
    </nav>
  );
}
