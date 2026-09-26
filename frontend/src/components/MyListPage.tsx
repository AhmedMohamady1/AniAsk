interface MyListPageProps {
  onNavigateHome: () => void;
  onNavigateToChat: () => void;
}

export default function MyListPage({
  onNavigateHome,
  onNavigateToChat,
}: MyListPageProps) {
  return (
    <div className="mylist-view">
      {/* Ambient background glows */}
      <div className="welcome-glow welcome-glow-primary" />
      <div className="welcome-glow welcome-glow-secondary" />

      <div className="mylist-container">
        <div className="mylist-empty-card">
          <div className="mylist-icon-bubble">
            <span className="material-symbols-outlined mylist-icon">
              bookmark_added
            </span>
          </div>

          <h2 className="mylist-title">My Anime Watchlist</h2>
          <p className="mylist-subtitle">
            Personal tracking, custom ratings, and reviews are coming soon.
          </p>

          <div className="mylist-feature-preview">
            <div className="preview-pill">
              <span className="material-symbols-outlined">visibility</span>
              <span>Watching</span>
            </div>
            <div className="preview-pill">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Completed</span>
            </div>
            <div className="preview-pill">
              <span className="material-symbols-outlined">schedule</span>
              <span>Plan to Watch</span>
            </div>
            <div className="preview-pill">
              <span className="material-symbols-outlined">star</span>
              <span>Custom Scores</span>
            </div>
          </div>

          <div className="mylist-actions">
            <button
              type="button"
              className="mylist-btn mylist-btn--primary"
              onClick={onNavigateHome}
            >
              <span className="material-symbols-outlined">explore</span>
              <span>Discover Trending Anime</span>
            </button>

            <button
              type="button"
              className="mylist-btn mylist-btn--secondary"
              onClick={onNavigateToChat}
            >
              <span className="material-symbols-outlined">smart_toy</span>
              <span>Ask AI Recommendations</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
