import { useEffect, useRef, useState } from "react";
import { getAnimeDetails } from "../api/anime";
import {
  deleteTrackingApi,
  getAnimeAverageRatingApi,
  getAnimeReviewsApi,
  upsertTrackingApi,
  type AnimeReview,
} from "../api/tracking";
import { useAuth } from "../context/AuthContext";
import type {
  AnimeDetails,
  AnimeMedia,
  AnimeStartDate,
  TrackingEntry,
  TrackingStatus,
} from "../types";
import {
  TRACKING_STATUS_ICONS,
  TRACKING_STATUS_LABELS,
  ratingToScore,
  scoreToRating,
} from "../types";

interface AnimeDetailModalProps {
  anime: AnimeMedia;
  onClose: () => void;
  onAskAI: (animeTitle: string) => void;
}

type ModalTab = "overview" | "reviews";

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanDescription(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\n[ \t]*\n[ \t]*\n+/g, "\n\n").replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatDate(date?: AnimeStartDate | null): string {
  if (!date || !date.year) return "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = date.month ? `${months[date.month - 1]} ` : "";
  const d = date.day ? `${date.day}, ` : "";
  return `${m}${d}${date.year}`;
}

function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return ""; }
}

/** Initials avatar: take first letter of each word, max 2 chars */
function initials(username: string | null): string {
  if (!username) return "?";
  return username.replace(/^@/, "").split(/[\s_-]/).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "").join("") || username[0]?.toUpperCase() || "?";
}

/** Deterministic color from username string */
const AVATAR_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#3b82f6","#10b981","#f97316",
];
function avatarColor(username: string | null): string {
  if (!username) return AVATAR_COLORS[0];
  let hash = 0;
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** localStorage helpers */
const lsKey = (id: number) => `aniask_tracking_${id}`;
function readLocalEntry(animeId: number): TrackingEntry | null {
  try {
    const raw = localStorage.getItem(lsKey(animeId));
    return raw ? (JSON.parse(raw) as TrackingEntry) : null;
  } catch { return null; }
}
function writeLocalEntry(entry: TrackingEntry) {
  localStorage.setItem(lsKey(entry.animeId), JSON.stringify(entry));
}
function removeLocalEntry(animeId: number) {
  localStorage.removeItem(lsKey(animeId));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnimeDetailModal({ anime, onClose, onAskAI }: AnimeDetailModalProps) {
  const { isAuthenticated, accessToken, openLogin, user } = useAuth();

  // AniList details
  const [details, setDetails] = useState<AnimeDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");

  // ── Tracking state (read from localStorage as cache) ──────────────
  const local = readLocalEntry(anime.id);
  const [trackStatus, setTrackStatus] = useState<TrackingStatus | null>(local?.status ?? null);
  const [trackScore,  setTrackScore]  = useState<number | null>(local?.score ?? null);
  const [trackReview, setTrackReview] = useState<string>(local?.review ?? "");
  const [hoverStar,   setHoverStar]   = useState<number | null>(null);
  const [isSaving,    setIsSaving]    = useState(false);
  const [isRemoving,  setIsRemoving]  = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [trackError,    setTrackError]   = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reviews state ─────────────────────────────────────────────────
  const [reviews,      setReviews]      = useState<AnimeReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoaded,  setReviewsLoaded]  = useState(false);
  const [avgRating, setAvgRating] = useState<string | null>(null);

  // Load reviews when tab switches to "reviews"
  useEffect(() => {
    if (activeTab !== "reviews" || reviewsLoaded) return;
    setReviewsLoading(true);
    Promise.all([
      getAnimeReviewsApi(anime.id),
      getAnimeAverageRatingApi(anime.id),
    ])
      .then(([rv, avg]) => {
        // Only show reviews that have actual text
        setReviews(rv.filter((r) => r.reviews && r.reviews.trim().length > 0));
        setAvgRating(avg.averageRating);
        setReviewsLoaded(true);
      })
      .catch(console.warn)
      .finally(() => setReviewsLoading(false));
  }, [activeTab, reviewsLoaded, anime.id]);

  // Refresh reviews when tracking is saved (user may have added a review)
  const refreshReviews = () => {
    setReviewsLoaded(false); // will re-fetch on next tab visit
    if (activeTab === "reviews") {
      setReviewsLoaded(false);
      setReviewsLoading(true);
      Promise.all([
        getAnimeReviewsApi(anime.id),
        getAnimeAverageRatingApi(anime.id),
      ])
        .then(([rv, avg]) => {
          setReviews(rv.filter((r) => r.reviews && r.reviews.trim().length > 0));
          setAvgRating(avg.averageRating);
          setReviewsLoaded(true);
        })
        .catch(console.warn)
        .finally(() => setReviewsLoading(false));
    }
  };

  // ── Save / Remove ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!trackStatus || !accessToken) return;
    setIsSaving(true);
    setTrackError(null);
    try {
      await upsertTrackingApi(
        {
          animeId: anime.id,
          status: trackStatus,
          ratings: scoreToRating(trackScore),
          reviews: trackReview.trim() || undefined,
        },
        accessToken
      );
      // Update local cache
      writeLocalEntry({
        animeId: anime.id,
        status: trackStatus,
        score: trackScore,
        review: trackReview.trim(),
        updatedAt: new Date().toISOString(),
      });
      window.dispatchEvent(new CustomEvent("aniask:tracking-updated"));
      setSavedFeedback(true);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setSavedFeedback(false), 2500);
      refreshReviews();
    } catch (err) {
      setTrackError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!accessToken) return;
    setIsRemoving(true);
    setTrackError(null);
    try {
      await deleteTrackingApi(anime.id, accessToken);
      removeLocalEntry(anime.id);
      window.dispatchEvent(new CustomEvent("aniask:tracking-updated"));
      setTrackStatus(null);
      setTrackScore(null);
      setTrackReview("");
      setSavedFeedback(false);
      refreshReviews();
    } catch (err) {
      setTrackError(err instanceof Error ? err.message : "Failed to remove.");
    } finally {
      setIsRemoving(false);
    }
  };

  // Cleanup timer
  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);

  // ── Fetch AniList details ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setDetailsLoading(true);
    getAnimeDetails(anime.id)
      .then((d) => { if (mounted) { setDetails(d); setDetailsLoading(false); } })
      .catch(() => { if (mounted) setDetailsLoading(false); });
    return () => { mounted = false; };
  }, [anime.id]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Derived display values ────────────────────────────────────────
  const displayTitle =
    details?.title.english || anime.title.english ||
    details?.title.romaji  || anime.title.romaji  ||
    anime.title.native || "Unknown Anime";

  const subtitle =
    details?.title.romaji && details.title.romaji !== displayTitle
      ? details.title.romaji
      : anime.title.romaji !== displayTitle ? anime.title.romaji : "";

  const nativeTitle = details?.title.native || anime.title.native;

  const bannerUrl  = details?.bannerImage || anime.bannerImage ||
    details?.coverImage?.extraLarge || anime.coverImage?.extraLarge;
  const posterUrl  = details?.coverImage?.extraLarge || details?.coverImage?.large ||
    anime.coverImage?.extraLarge || anime.coverImage?.large ||
    "https://via.placeholder.com/300x420/1e293b/94a3b8?text=No+Cover";

  const studioEdges    = details?.studios?.edges || [];
  const mainStudio     = studioEdges.find((e) => e.isMain)?.node.name || studioEdges[0]?.node.name;
  const producerStudios = studioEdges.filter((e) => !e.isMain && e.node.name !== mainStudio).map((e) => e.node.name);
  const characterEdges = details?.characters?.edges || [];

  const score      = details?.averageScore ?? anime.averageScore;
  const meanScore  = details?.meanScore;
  const format     = details?.format || anime.format || "TV";
  const episodes   = details?.episodes ?? anime.episodes;
  const duration   = details?.duration;
  const status     = details?.status || anime.status || "FINISHED";
  const season     = details?.season
    ? `${details.season} ${details.seasonYear || ""}`.trim()
    : anime.startDate?.year ? `${anime.startDate.year}` : null;
  const startDateStr = formatDate(details?.startDate || anime.startDate);
  const endDateStr   = formatDate(details?.endDate);
  const popularity   = details?.popularity || anime.popularity;
  const genres       = details?.genres || anime.genres || [];
  const description  = cleanDescription(details?.description || anime.description);
  const anilistUrl   = `https://anilist.co/anime/${anime.id}`;

  // Community avg from our backend (ratings are 0–100, display as /10)
  const communityAvg = avgRating
    ? (parseFloat(avgRating) / 10).toFixed(1)
    : null;

  // Count of all ratings (reviews list includes score-only entries; we fetched only reviewed ones)
  const reviewsWithText = reviews.length;

  return (
    <div
      className="anime-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="anime-modal-title"
    >
      <div className="anime-modal-card" onClick={(e) => e.stopPropagation()}>

        {/* Banner */}
        <div className="anime-modal-banner-container">
          {bannerUrl
            ? <img src={bannerUrl} alt={`${displayTitle} banner`} className="anime-modal-banner-img" />
            : <div className="anime-modal-banner-placeholder" />}
          <div className="anime-modal-banner-gradient" />
          <button type="button" className="anime-modal-close-btn" onClick={onClose} title="Close (Esc)">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="anime-modal-content">

          {/* Header row */}
          <div className="anime-modal-header-row">
            <img src={posterUrl} alt={displayTitle} className="anime-modal-poster-img" />
            <div className="anime-modal-title-block">
              <h2 id="anime-modal-title" className="anime-modal-title">{displayTitle}</h2>
              {subtitle && <p className="anime-modal-subtitle">{subtitle}</p>}
              {nativeTitle && nativeTitle !== displayTitle && (
                <p className="anime-modal-native-title">{nativeTitle}</p>
              )}
              <div className="anime-modal-meta-pills">
                {score != null && (
                  <span className="modal-pill modal-pill--score">
                    <span className="material-symbols-outlined modal-pill-icon">star</span>
                    <span>{score}% Score</span>
                  </span>
                )}
                {mainStudio
                  ? <span className="modal-pill modal-pill--studio">
                      <span className="material-symbols-outlined modal-pill-icon">movie</span>
                      <span>{mainStudio}</span>
                    </span>
                  : detailsLoading
                  ? <span className="modal-pill modal-pill--loading">
                      <span className="spinner-icon material-symbols-outlined">progress_activity</span>
                      <span>Loading studio...</span>
                    </span>
                  : null}
                <span className="modal-pill modal-pill--info">
                  <span className="material-symbols-outlined modal-pill-icon">tv</span>
                  <span>{format}{episodes ? ` • ${episodes} eps` : ""}{duration ? ` (${duration}m)` : ""}</span>
                </span>
                {season && (
                  <span className="modal-pill modal-pill--season">
                    <span className="material-symbols-outlined modal-pill-icon">calendar_month</span>
                    <span>{season}</span>
                  </span>
                )}
                <span className="modal-pill modal-pill--status">
                  <span className="material-symbols-outlined modal-pill-icon">info</span>
                  <span>{status}</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="modal-tabs">
            <button
              type="button"
              className={`modal-tab-btn${activeTab === "overview" ? " modal-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <span className="material-symbols-outlined">info</span>
              Overview
            </button>
            <button
              type="button"
              className={`modal-tab-btn${activeTab === "reviews" ? " modal-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              <span className="material-symbols-outlined">rate_review</span>
              Reviews
              {reviewsWithText > 0 && (
                <span className="modal-tab-count">{reviewsWithText}</span>
              )}
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════
              OVERVIEW TAB
          ═══════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <>
              {/* Stats bar */}
              <div className="anime-modal-stats-bar">
                {score != null && (
                  <div className="stat-card">
                    <span className="stat-label">AniList Rating</span>
                    <span className="stat-value text-accent-green">
                      {score}%{meanScore ? ` (Mean: ${meanScore}%)` : ""}
                    </span>
                  </div>
                )}
                {popularity != null && (
                  <div className="stat-card">
                    <span className="stat-label">Popularity</span>
                    <span className="stat-value">{popularity.toLocaleString()} members</span>
                  </div>
                )}
                {startDateStr && (
                  <div className="stat-card">
                    <span className="stat-label">Airing Period</span>
                    <span className="stat-value">
                      {startDateStr}{endDateStr ? ` – ${endDateStr}` : status === "RELEASING" ? " (Ongoing)" : ""}
                    </span>
                  </div>
                )}
                {details?.countryOfOrigin && (
                  <div className="stat-card">
                    <span className="stat-label">Origin</span>
                    <span className="stat-value">
                      {details.countryOfOrigin === "JP" ? "Japan (JP)" : details.countryOfOrigin}
                    </span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div className="anime-modal-genres">
                  {genres.map((g) => <span key={g} className="genre-chip genre-chip--lg">{g}</span>)}
                </div>
              )}

              {/* Synopsis */}
              <div className="anime-modal-synopsis-section">
                <div className="synopsis-header">
                  <span className="material-symbols-outlined synopsis-icon">description</span>
                  <h3>Synopsis</h3>
                </div>
                {detailsLoading && !description ? (
                  <div className="synopsis-skeleton-container">
                    <div className="skeleton-line skeleton-line--synopsis-1" />
                    <div className="skeleton-line skeleton-line--synopsis-2" />
                    <div className="skeleton-line skeleton-line--synopsis-3" />
                  </div>
                ) : (
                  <p className="synopsis-text">{description || "No description available."}</p>
                )}
              </div>

              {/* Characters & VAs */}
              <div className="anime-modal-characters-section">
                <div className="section-title-row">
                  <span className="material-symbols-outlined section-title-icon">record_voice_over</span>
                  <h3>Characters & Voice Actors</h3>
                </div>
                {detailsLoading ? (
                  <div className="characters-grid">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="character-va-card character-va-card--skeleton">
                        <div className="char-va-side">
                          <div className="skeleton-avatar" />
                          <div className="skeleton-text-group">
                            <div className="skeleton-line skeleton-line--name" />
                            <div className="skeleton-line skeleton-line--sub" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : characterEdges.length === 0 ? (
                  <p className="section-empty-hint">No character records available.</p>
                ) : (
                  <div className="characters-grid">
                    {characterEdges.slice(0, 8).map((edge, idx) => {
                      const char = edge.node;
                      const va   = edge.voiceActors?.[0];
                      const charImg = char.image?.large || char.image?.medium ||
                        "https://via.placeholder.com/80x100/1e293b/94a3b8?text=Char";
                      const vaImg = va?.image?.large || va?.image?.medium;
                      return (
                        <div key={char.id || idx} className="character-va-card">
                          <div className="char-side">
                            <img src={charImg} alt={char.name.full} loading="lazy" className="char-avatar" />
                            <div className="char-info">
                              <p className="char-name" title={char.name.full}>{char.name.full}</p>
                              <span className={`char-role-badge ${edge.role === "MAIN" ? "char-role-badge--main" : "char-role-badge--supporting"}`}>
                                {edge.role || "Character"}
                              </span>
                            </div>
                          </div>
                          {va && (
                            <div className="va-side">
                              <div className="va-info">
                                <p className="va-name" title={va.name.full}>{va.name.full}</p>
                                <span className="va-lang-tag">Japanese VA</span>
                              </div>
                              {vaImg
                                ? <img src={vaImg} alt={va.name.full} loading="lazy" className="va-avatar" />
                                : <div className="va-avatar-placeholder"><span className="material-symbols-outlined">person</span></div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Studios */}
              {(mainStudio || producerStudios.length > 0) && (
                <div className="anime-modal-studios-section">
                  <div className="section-title-row">
                    <span className="material-symbols-outlined section-title-icon">movie_creation</span>
                    <h3>Studios & Production</h3>
                  </div>
                  <div className="studios-chips-container">
                    {mainStudio && (
                      <div className="studio-pill studio-pill--main">
                        <span className="material-symbols-outlined">apartment</span>
                        <div className="studio-pill-text">
                          <span className="studio-role">Animation Studio</span>
                          <span className="studio-name">{mainStudio}</span>
                        </div>
                      </div>
                    )}
                    {producerStudios.map((name) => (
                      <div key={name} className="studio-pill studio-pill--producer">
                        <span className="material-symbols-outlined">business</span>
                        <div className="studio-pill-text">
                          <span className="studio-role">Producer</span>
                          <span className="studio-name">{name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Your Tracking */}
              <div className="anime-modal-tracking-section">
                <div className="tracking-section-header">
                  <span className="material-symbols-outlined">bookmark_added</span>
                  <h3>Your Tracking</h3>
                </div>

                {!isAuthenticated ? (
                  <div className="tracking-login-prompt">
                    <span className="material-symbols-outlined">lock</span>
                    <span>
                      <button type="button" className="tracking-login-link" onClick={openLogin}>
                        Sign in
                      </button>{" "}
                      to track this anime, rate it, and write a review.
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Status pills */}
                    <div className="tracking-row">
                      <span className="tracking-row-label">Status</span>
                      <div className="tracking-status-pills">
                        {(Object.entries(TRACKING_STATUS_LABELS) as [TrackingStatus, string][]).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            className={`tracking-status-btn${trackStatus === value ? " tracking-status-btn--active" : ""}`}
                            onClick={() => setTrackStatus(trackStatus === value ? null : value)}
                          >
                            <span className="material-symbols-outlined">{TRACKING_STATUS_ICONS[value]}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="tracking-row">
                      <span className="tracking-row-label">Score</span>
                      <div className="tracking-stars">
                        {[1,2,3,4,5,6,7,8,9,10].map((star) => {
                          const filled = hoverStar !== null ? star <= hoverStar : trackScore !== null && star <= trackScore;
                          const hovered = hoverStar !== null && star <= hoverStar;
                          return (
                            <button
                              key={star}
                              type="button"
                              className={`tracking-star-btn${filled ? (hovered ? " tracking-star-btn--hovered" : " tracking-star-btn--filled") : ""}`}
                              onMouseEnter={() => setHoverStar(star)}
                              onMouseLeave={() => setHoverStar(null)}
                              onClick={() => setTrackScore(trackScore === star ? null : star)}
                              title={`${star}/10`}
                            >★</button>
                          );
                        })}
                        <span className={`tracking-score-display${trackScore !== null ? " tracking-score-display--rated" : ""}`}>
                          {hoverStar !== null ? `${hoverStar}/10` : trackScore !== null ? `${trackScore}/10` : "—"}
                        </span>
                        {trackScore !== null && (
                          <button type="button" className="tracking-clear-score" onClick={() => setTrackScore(null)}>
                            ✕ clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Review */}
                    <div className="tracking-row">
                      <span className="tracking-row-label">Review</span>
                      <div className="tracking-review-wrap">
                        <textarea
                          className="tracking-review-textarea"
                          placeholder="Write your thoughts about this anime…"
                          value={trackReview}
                          onChange={(e) => setTrackReview(e.target.value)}
                          maxLength={2000}
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {trackError && (
                      <p style={{ color: "var(--color-error)", fontSize: "0.8rem" }}>{trackError}</p>
                    )}

                    {/* Save / Remove */}
                    <div className="tracking-save-row">
                      {savedFeedback && (
                        <span className="tracking-save-feedback">
                          <span className="material-symbols-outlined">check_circle</span>
                          Saved!
                        </span>
                      )}
                      {readLocalEntry(anime.id) && (
                        <button
                          type="button"
                          className="tracking-remove-btn"
                          onClick={handleRemove}
                          disabled={isRemoving}
                        >
                          <span className="material-symbols-outlined">delete</span>
                          {isRemoving ? "Removing…" : "Remove"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="tracking-save-btn"
                        onClick={handleSave}
                        disabled={!trackStatus || isSaving}
                        title={!trackStatus ? "Select a status first" : "Save tracking"}
                      >
                        <span className="material-symbols-outlined">save</span>
                        {isSaving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="anime-modal-actions-bar">
                <button
                  type="button"
                  className="modal-action-btn modal-action-btn--ask"
                  onClick={() => onAskAI(displayTitle)}
                >
                  <span className="material-symbols-outlined">smart_toy</span>
                  <span>Ask AI About This Anime</span>
                </button>
                <a
                  href={anilistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-action-btn modal-action-btn--anilist"
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                  <span>View on AniList</span>
                </a>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════
              REVIEWS TAB
          ═══════════════════════════════════════════════════════ */}
          {activeTab === "reviews" && (
            <div className="modal-reviews-tab">

              {/* Community rating summary */}
              <div className="modal-community-rating">
                <div className="community-rating-star-block">
                  <span className="community-rating-star">★</span>
                  <span className="community-rating-value">
                    {communityAvg ?? "—"}
                  </span>
                  <span className="community-rating-max">/10</span>
                </div>
                <p className="community-rating-label">
                  {avgRating
                    ? `Community average from AniAsk users`
                    : "No ratings yet — be the first!"}
                </p>
              </div>

              {/* Reviews list */}
              {reviewsLoading ? (
                <div className="modal-reviews-loading">
                  <span className="material-symbols-outlined spinner-icon">progress_activity</span>
                  Loading reviews…
                </div>
              ) : reviews.length === 0 ? (
                <div className="modal-reviews-empty">
                  <span className="material-symbols-outlined">rate_review</span>
                  <p>No written reviews yet.</p>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      className="modal-write-review-btn"
                      onClick={() => setActiveTab("overview")}
                    >
                      <span className="material-symbols-outlined">edit</span>
                      Write the First Review
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="modal-write-review-btn"
                      onClick={openLogin}
                    >
                      <span className="material-symbols-outlined">login</span>
                      Sign In to Write a Review
                    </button>
                  )}
                </div>
              ) : (
                <div className="modal-reviews-list">
                  {reviews.map((rv) => {
                    const starScore = ratingToScore(rv.ratings);
                    const isOwn = user?.username === rv.username;
                    return (
                      <div key={rv.id} className={`review-card${isOwn ? " review-card--own" : ""}`}>
                        {isOwn && <span className="review-card-own-badge">Your Review</span>}
                        <div className="review-card-header">
                          {/* Avatar */}
                          <div
                            className="review-avatar"
                            style={{ background: avatarColor(rv.username) }}
                            title={rv.username ?? "Anonymous"}
                          >
                            {initials(rv.username)}
                          </div>
                          <div className="review-meta">
                            <span className="review-username">@{rv.username ?? "anonymous"}</span>
                            <span className="review-date">{formatReviewDate(rv.updatedAt)}</span>
                          </div>
                          {/* Stars */}
                          {starScore !== null && (
                            <div className="review-score-block">
                              <span className="review-score-stars">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <span key={i} className={i < starScore ? "review-star review-star--filled" : "review-star"}>★</span>
                                ))}
                              </span>
                              <span className="review-score-num">{starScore}/10</span>
                            </div>
                          )}
                          {isOwn && (
                            <button
                              type="button"
                              className="review-edit-btn"
                              onClick={() => setActiveTab("overview")}
                              title="Edit in Overview tab"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        <p className="review-text">{rv.reviews}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Write a review CTA at bottom */}
              {reviews.length > 0 && (
                <button
                  type="button"
                  className="modal-write-review-btn modal-write-review-btn--bottom"
                  onClick={() => isAuthenticated ? setActiveTab("overview") : openLogin()}
                >
                  <span className="material-symbols-outlined">edit</span>
                  {isAuthenticated ? "Write or Edit Your Review" : "Sign In to Write a Review"}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
