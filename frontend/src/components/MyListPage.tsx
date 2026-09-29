import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAnimeDetails } from "../api/anime";
import { useAuth } from "../context/AuthContext";
import type { AnimeMedia, TrackingEntry, TrackingStatus } from "../types";

interface MyListPageProps {
  onNavigateHome: () => void;
  onNavigateToChat: () => void;
  onOpenAnimeDetail?: (anime: AnimeMedia) => void;
}

/** Read all aniask_tracking_* entries from localStorage */
function loadAllEntries(): TrackingEntry[] {
  const entries: TrackingEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("aniask_tracking_")) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? "");
      if (parsed?.animeId && parsed?.status) entries.push(parsed as TrackingEntry);
    } catch { /* skip malformed */ }
  }
  return entries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

const STATUS_TABS: { label: string; value: TrackingStatus | "All" }[] = [
  { label: "All",       value: "All"       },
  { label: "Watching",  value: "Watching"  },
  { label: "Completed", value: "Completed" },
  { label: "On Hold",   value: "On Hold"   },
  { label: "Dropped",   value: "Dropped"   },
  { label: "Planning",  value: "Planning"  },
];

const STATUS_ICONS: Record<TrackingStatus, string> = {
  Watching:  "play_circle",
  Completed: "check_circle",
  "On Hold": "pause_circle",
  Dropped:   "cancel",
  Planning:  "bookmark",
};

const STATUS_COLORS: Record<TrackingStatus, string> = {
  Watching:  "mylist-status--watching",
  Completed: "mylist-status--completed",
  "On Hold": "mylist-status--onhold",
  Dropped:   "mylist-status--dropped",
  Planning:  "mylist-status--planning",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return "—"; }
}

/** Separate anime metadata cache from tracking entries */
type AnimeCache = Record<number, { anime: AnimeMedia | null; loading: boolean }>;

export default function MyListPage({
  onNavigateHome,
  onNavigateToChat,
  onOpenAnimeDetail,
}: MyListPageProps) {
  const { user, isAuthenticated, openLogin } = useAuth();

  const [entries, setEntries]       = useState<TrackingEntry[]>(loadAllEntries);
  const [animeCache, setAnimeCache] = useState<AnimeCache>({});
  const [activeTab, setActiveTab]   = useState<TrackingStatus | "All">("All");

  // Keep a ref to current cache so the event handler can read fresh state
  const animeCacheRef = useRef<AnimeCache>({});
  animeCacheRef.current = animeCache;

  /** Fetch metadata for any IDs not yet in cache */
  const fetchMissing = useCallback((ids: number[]) => {
    ids.forEach((id) => {
      if (animeCacheRef.current[id]) return; // already cached
      setAnimeCache((prev) => ({ ...prev, [id]: { anime: null, loading: true } }));
      getAnimeDetails(id)
        .then((details) =>
          setAnimeCache((prev) => ({
            ...prev,
            [id]: { anime: details as AnimeMedia, loading: false },
          }))
        )
        .catch(() =>
          setAnimeCache((prev) => ({
            ...prev,
            [id]: { anime: null, loading: false },
          }))
        );
    });
  }, []);

  /** Re-read localStorage and update entries; fetch new IDs */
  const refresh = useCallback(() => {
    const fresh = loadAllEntries();
    setEntries(fresh);
    fetchMissing(fresh.map((e) => e.animeId));
  }, [fetchMissing]);

  // Initial load
  useEffect(() => {
    fetchMissing(entries.map((e) => e.animeId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for tracking changes (from modal save/remove or card quick actions)
  useEffect(() => {
    window.addEventListener("aniask:tracking-updated", refresh);
    return () => window.removeEventListener("aniask:tracking-updated", refresh);
  }, [refresh]);

  const filtered = useMemo(
    () => entries.filter((e) => activeTab === "All" || e.status === activeTab),
    [entries, activeTab]
  );

  const tabCount = (tab: TrackingStatus | "All") =>
    tab === "All" ? entries.length : entries.filter((e) => e.status === tab).length;

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

  // ── Authenticated — empty ────────────────────────────────────────
  if (entries.length === 0) {
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
              <p className="mylist-full-subtitle">{entries.length} anime tracked</p>
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
              {filtered.map((entry) => {
                const cached  = animeCache[entry.animeId];
                const anime   = cached?.anime ?? null;
                const isLoading = cached?.loading ?? true;

                const title =
                  anime?.title?.english ||
                  anime?.title?.romaji  ||
                  anime?.title?.native  ||
                  `Anime #${entry.animeId}`;

                const coverUrl =
                  anime?.coverImage?.large ??
                  anime?.coverImage?.extraLarge ??
                  null;

                return (
                  <tr key={entry.animeId} className="mylist-row">
                    {/* Cover */}
                    <td className="mylist-td mylist-td--cover">
                      {isLoading ? (
                        <div className="mylist-cover-skeleton" />
                      ) : coverUrl ? (
                        <img src={coverUrl} alt={title} className="mylist-cover-img" loading="lazy" />
                      ) : (
                        <div className="mylist-cover-placeholder">
                          <span className="material-symbols-outlined">image_not_supported</span>
                        </div>
                      )}
                    </td>

                    {/* Title */}
                    <td className="mylist-td mylist-td--title">
                      {isLoading ? (
                        <div className="mylist-skeleton-line mylist-skeleton-title" />
                      ) : (
                        <span className="mylist-title-text" title={title}>{title}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="mylist-td mylist-td--status">
                      <span className={`mylist-status-badge ${STATUS_COLORS[entry.status]}`}>
                        <span className="material-symbols-outlined">{STATUS_ICONS[entry.status]}</span>
                        {entry.status}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="mylist-td mylist-td--score">
                      {entry.score !== null ? (
                        <span className="mylist-score">
                          <span className="mylist-score-star">★</span>
                          {entry.score}
                          <span className="mylist-score-max">/10</span>
                        </span>
                      ) : (
                        <span className="mylist-score-none">—</span>
                      )}
                    </td>

                    {/* Review snippet */}
                    <td className="mylist-td mylist-td--review">
                      {entry.review ? (
                        <span className="mylist-review-snippet" title={entry.review}>
                          {entry.review.length > 60 ? entry.review.slice(0, 60) + "…" : entry.review}
                        </span>
                      ) : (
                        <span className="mylist-review-none">No review</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="mylist-td mylist-td--date">
                      <span className="mylist-date">{formatDate(entry.updatedAt)}</span>
                    </td>

                    {/* Edit */}
                    <td className="mylist-td mylist-td--edit">
                      {anime && onOpenAnimeDetail && (
                        <button
                          type="button"
                          className="mylist-edit-btn"
                          onClick={() => onOpenAnimeDetail(anime)}
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
