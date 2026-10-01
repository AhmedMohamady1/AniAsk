import { useCallback, useEffect, useMemo, useState } from "react";
import { getUserTrackingApi, type TrackingListItem } from "../api/tracking";
import { useAuth } from "../context/AuthContext";
import type { AnimeMedia, TrackingStatus } from "../types";
import {
  TRACKING_STATUS_COLORS,
  TRACKING_STATUS_ICONS,
  TRACKING_STATUS_LABELS,
  ratingToScore,
} from "../types";

interface MyListPageProps {
  onNavigateHome: () => void;
  onNavigateToChat: () => void;
  onOpenAnimeDetail?: (anime: AnimeMedia) => void;
}

const STATUS_TABS: { label: string; value: TrackingStatus | "All" }[] = [
  { label: "All",       value: "All"       },
  { label: "Watching",  value: "watching"  },
  { label: "Completed", value: "completed" },
  { label: "On Hold",   value: "on_hold"   },
  { label: "Dropped",   value: "dropped"   },
  { label: "Planning",  value: "planning"  },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return "—"; }
}

export default function MyListPage({
  onNavigateHome,
  onNavigateToChat,
  onOpenAnimeDetail,
}: MyListPageProps) {
  const { user, isAuthenticated, accessToken, openLogin } = useAuth();

  const [items, setItems]     = useState<TrackingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TrackingStatus | "All">("All");

  const fetchList = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getUserTrackingApi({ perPage: 50 }, accessToken);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your list.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) fetchList();
  }, [isAuthenticated, fetchList]);

  // Re-fetch when tracking changes (modal save/remove/card quick-action)
  useEffect(() => {
    window.addEventListener("aniask:tracking-updated", fetchList);
    return () => window.removeEventListener("aniask:tracking-updated", fetchList);
  }, [fetchList]);

  const filtered = useMemo(
    () => items.filter((item) => activeTab === "All" || item.tracking.status === activeTab),
    [items, activeTab]
  );

  const tabCount = (tab: TrackingStatus | "All") =>
    tab === "All" ? items.length : items.filter((i) => i.tracking.status === tab).length;

  // ── Unauthenticated ──────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="mylist-view">
        <div className="welcome-glow welcome-glow-primary" />
        <div className="welcome-glow welcome-glow-secondary" />
        <div className="mylist-container">
          <div className="mylist-empty-card">
            <div className="mylist-icon-bubble">
              <span className="material-symbols-outlined mylist-icon">bookmark_added</span>
            </div>
            <h2 className="mylist-title">My Anime Watchlist</h2>
            <p className="mylist-subtitle">
              Sign in to sync your personal anime tracking, custom ratings, and reviews across your devices.
            </p>
            <div className="mylist-feature-preview">
              {(["play_circle","check_circle","bookmark","star"] as const).map((icon, i) => (
                <div key={i} className="preview-pill">
                  <span className="material-symbols-outlined">{icon}</span>
                  <span>{["Watching","Completed","Planning","Custom Scores"][i]}</span>
                </div>
              ))}
            </div>
            <div className="mylist-actions">
              <button type="button" className="mylist-btn mylist-btn--primary" onClick={openLogin}>
                <span className="material-symbols-outlined">login</span>
                <span>Sign In to Your Account</span>
              </button>
              <button type="button" className="mylist-btn mylist-btn--secondary" onClick={onNavigateHome}>
                <span className="material-symbols-outlined">explore</span>
                <span>Discover Trending Anime</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated — loading ──────────────────────────────────────
  if (loading && items.length === 0) {
    return (
      <div className="mylist-view">
        <div className="mylist-container">
          <div className="mylist-empty-card">
            <span className="material-symbols-outlined spinner-icon" style={{ fontSize: "2.5rem", color: "var(--color-primary)" }}>
              progress_activity
            </span>
            <p style={{ color: "var(--color-text-muted)", marginTop: "1rem" }}>Loading your list…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated — error ────────────────────────────────────────
  if (error) {
    return (
      <div className="mylist-view">
        <div className="mylist-container">
          <div className="mylist-empty-card">
            <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "var(--color-error)" }}>error</span>
            <p style={{ color: "var(--color-error)", marginTop: "1rem" }}>{error}</p>
            <button type="button" className="mylist-btn mylist-btn--primary" onClick={fetchList} style={{ marginTop: "1rem" }}>
              <span className="material-symbols-outlined">refresh</span>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated — empty ────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="mylist-view">
        <div className="welcome-glow welcome-glow-primary" />
        <div className="welcome-glow welcome-glow-secondary" />
        <div className="mylist-container">
          <div className="mylist-empty-card">
            <div className="mylist-icon-bubble">
              <span className="material-symbols-outlined mylist-icon">library_add</span>
            </div>
            <h2 className="mylist-title">{user?.firstName}&apos;s Anime List</h2>
            <p className="mylist-subtitle">
              Your list is empty. Open any anime and use the{" "}
              <strong style={{ color: "var(--color-primary)" }}>Your Tracking</strong>{" "}
              section — or hover a card and click the quick-add buttons!
            </p>
            <div className="mylist-actions">
              <button type="button" className="mylist-btn mylist-btn--primary" onClick={onNavigateHome}>
                <span className="material-symbols-outlined">explore</span>
                <span>Discover Anime to Track</span>
              </button>
              <button type="button" className="mylist-btn mylist-btn--secondary" onClick={onNavigateToChat}>
                <span className="material-symbols-outlined">smart_toy</span>
                <span>Ask AI for Recommendations</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated — list view ────────────────────────────────────
  return (
    <div className="mylist-full-view">
      {/* Header */}
      <div className="mylist-full-header">
        <div className="mylist-full-header-inner">
          <div className="mylist-full-title-block">
            <span className="material-symbols-outlined mylist-full-icon">bookmark_added</span>
            <div>
              <h1 className="mylist-full-title">{user?.firstName}&apos;s Anime List</h1>
              <p className="mylist-full-subtitle">{items.length} anime tracked</p>
            </div>
          </div>
          <button type="button" className="mylist-btn mylist-btn--secondary mylist-discover-btn" onClick={onNavigateHome}>
            <span className="material-symbols-outlined">add</span>
            <span>Add More</span>
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="mylist-tabs">
          {STATUS_TABS.map((tab) => {
            const count = tabCount(tab.value);
            if (tab.value !== "All" && count === 0) return null;
            return (
              <button
                key={tab.value}
                type="button"
                className={`mylist-tab${activeTab === tab.value ? " mylist-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
                <span className="mylist-tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="mylist-table-wrap">
        {filtered.length === 0 ? (
          <div className="mylist-tab-empty">
            <span className="material-symbols-outlined">filter_list_off</span>
            <p>No anime in this category.</p>
          </div>
        ) : (
          <table className="mylist-table">
            <thead>
              <tr>
                <th className="mylist-th mylist-th--cover" />
                <th className="mylist-th mylist-th--title">Title</th>
                <th className="mylist-th mylist-th--status">Status</th>
                <th className="mylist-th mylist-th--score">Score</th>
                <th className="mylist-th mylist-th--review">Review</th>
                <th className="mylist-th mylist-th--date">Saved</th>
                <th className="mylist-th mylist-th--edit" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const { anime, tracking } = item;
                const status = tracking.status;
                const starScore = ratingToScore(tracking.ratings);

                const title =
                  anime?.title?.english ||
                  anime?.title?.romaji  ||
                  anime?.title?.native  ||
                  `Anime #${tracking.id}`;

                const coverUrl =
                  anime?.coverImage?.extraLarge ??
                  anime?.coverImage?.large ??
                  null;

                // Build AnimeMedia shape for the edit button
                const animeMedia: AnimeMedia | null = anime
                  ? {
                      id: anime.id,
                      title: anime.title,
                      coverImage: anime.coverImage ?? undefined,
                      averageScore: anime.averageScore ?? undefined,
                      episodes: anime.episodes ?? undefined,
                      format: anime.format ?? undefined,
                      status: anime.status ?? undefined,
                    }
                  : null;

                return (
                  <tr key={tracking.id} className="mylist-row">
                    {/* Cover */}
                    <td className="mylist-td mylist-td--cover">
                      {coverUrl ? (
                        <img src={coverUrl} alt={title} className="mylist-cover-img" loading="lazy" />
                      ) : (
                        <div className="mylist-cover-placeholder">
                          <span className="material-symbols-outlined">image_not_supported</span>
                        </div>
                      )}
                    </td>

                    {/* Title */}
                    <td className="mylist-td mylist-td--title">
                      <span className="mylist-title-text" title={title}>{title}</span>
                    </td>

                    {/* Status */}
                    <td className="mylist-td mylist-td--status">
                      <span className={`mylist-status-badge mylist-status--${TRACKING_STATUS_COLORS[status]}`}>
                        <span className="material-symbols-outlined">{TRACKING_STATUS_ICONS[status]}</span>
                        {TRACKING_STATUS_LABELS[status]}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="mylist-td mylist-td--score">
                      {starScore !== null ? (
                        <span className="mylist-score">
                          <span className="mylist-score-star">★</span>
                          {starScore}
                          <span className="mylist-score-max">/10</span>
                        </span>
                      ) : (
                        <span className="mylist-score-none">—</span>
                      )}
                    </td>

                    {/* Review snippet */}
                    <td className="mylist-td mylist-td--review">
                      {tracking.reviews ? (
                        <span className="mylist-review-snippet" title={tracking.reviews}>
                          {tracking.reviews.length > 60
                            ? tracking.reviews.slice(0, 60) + "…"
                            : tracking.reviews}
                        </span>
                      ) : (
                        <span className="mylist-review-none">No review</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="mylist-td mylist-td--date">
                      <span className="mylist-date">{formatDate(tracking.updatedAt)}</span>
                    </td>

                    {/* Edit */}
                    <td className="mylist-td mylist-td--edit">
                      {animeMedia && onOpenAnimeDetail && (
                        <button
                          type="button"
                          className="mylist-edit-btn"
                          onClick={() => onOpenAnimeDetail(animeMedia)}
                          title="Edit tracking"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
