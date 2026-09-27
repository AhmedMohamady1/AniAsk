import { useAuth } from "../context/AuthContext";

interface MyListPageProps {
  onNavigateHome: () => void;
  onNavigateToChat: () => void;
}

export default function MyListPage({
  onNavigateHome,
  onNavigateToChat,
}: MyListPageProps) {
  const { user, isAuthenticated, openLogin } = useAuth();

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

          <h2 className="mylist-title">
            {isAuthenticated && user
              ? `${user.firstName}'s Anime Watchlist`
              : "My Anime Watchlist"}
          </h2>
          <p className="mylist-subtitle">
            {isAuthenticated && user ? (
              <>
                Signed in as <strong style={{ color: "var(--color-primary)" }}>@{user.username}</strong>.
                {" "}Personal anime tracking and custom ratings are coming to your profile soon!
              </>
            ) : (
              "Sign in to sync your personal anime tracking, custom ratings, and reviews across your devices."
            )}
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
            {!isAuthenticated && (
              <button
                type="button"
                className="mylist-btn mylist-btn--primary"
                onClick={openLogin}
              >
                <span className="material-symbols-outlined">login</span>
                <span>Sign In to Your Account</span>
              </button>
            )}

            <button
              type="button"
              className={`mylist-btn ${
                isAuthenticated ? "mylist-btn--primary" : "mylist-btn--secondary"
              }`}
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

