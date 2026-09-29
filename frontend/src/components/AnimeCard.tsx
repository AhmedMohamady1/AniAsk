import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { AnimeMedia, TrackingEntry, TrackingStatus } from "../types";

interface AnimeCardProps {
  anime: AnimeMedia;
  rank?: number;
  onClick?: () => void;
}

const STATUSES: { value: TrackingStatus; icon: string }[] = [
  { value: "Watching",  icon: "play_circle"  },
  { value: "Completed", icon: "check_circle" },
  { value: "On Hold",   icon: "pause_circle" },
  { value: "Dropped",   icon: "cancel"       },
  { value: "Planning",  icon: "bookmark"     },
];

const STATUS_COLOR_CLASS: Record<TrackingStatus, string> = {
  Watching:  "card-track-badge--watching",
  Completed: "card-track-badge--completed",
  "On Hold": "card-track-badge--onhold",
  Dropped:   "card-track-badge--dropped",
  Planning:  "card-track-badge--planning",
};

function readStatus(animeId: number): TrackingStatus | null {
  try {
    const raw = localStorage.getItem(`aniask_tracking_${animeId}`);
    return raw ? (JSON.parse(raw) as TrackingEntry).status : null;
  } catch { return null; }
}

export default function AnimeCard({ anime, rank, onClick }: AnimeCardProps) {
  const { isAuthenticated, openLogin } = useAuth();

  const displayTitle =
    anime.title.english || anime.title.romaji || anime.title.native || "Unknown Anime";
  const subtitle =
    anime.title.romaji && anime.title.romaji !== displayTitle
      ? anime.title.romaji
      : anime.title.native || "";

  const coverUrl =
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    "https://via.placeholder.com/300x420/1e293b/94a3b8?text=No+Cover";

  const formatEpisodes = () => {
    const parts: string[] = [];
    if (anime.format) parts.push(anime.format);
    if (anime.episodes) parts.push(`${anime.episodes} eps`);
    else if (anime.status === "RELEASING") parts.push("Airing");
    if (anime.startDate?.year) parts.push(`${anime.startDate.year}`);
    return parts.join(" • ");
  };

  const scoreColorClass =
    anime.averageScore && anime.averageScore >= 80
      ? "score-high"
      : anime.averageScore && anime.averageScore >= 70
      ? "score-medium"
      : "score-normal";

  // ── Tracking quick-action state ──────────────────────────────────
  const [currentStatus, setCurrentStatus] = useState<TrackingStatus | null>(
    () => readStatus(anime.id)
  );
  const [popoverOpen, setPopoverOpen]   = useState(false);
  const [justSaved, setJustSaved]       = useState<TrackingStatus | null>(null);
  const savedTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverRef  = useRef<HTMLDivElement>(null);

  // Listen for external tracking changes (modal save/remove)
  useEffect(() => {
    const handler = () => setCurrentStatus(readStatus(anime.id));
    window.addEventListener("aniask:tracking-updated", handler);
    return () => window.removeEventListener("aniask:tracking-updated", handler);
  }, [anime.id]);

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  // Cleanup feedback timer
  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  const saveStatus = (status: TrackingStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { openLogin(); return; }

    // Read existing entry to preserve score/review
    let existing: TrackingEntry | null = null;
    try {
      const raw = localStorage.getItem(`aniask_tracking_${anime.id}`);
      if (raw) existing = JSON.parse(raw) as TrackingEntry;
    } catch { /* ignore */ }

    const entry: TrackingEntry = {
      animeId:   anime.id,
      status,
      score:     existing?.score  ?? null,
      review:    existing?.review ?? "",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`aniask_tracking_${anime.id}`, JSON.stringify(entry));
    setCurrentStatus(status);
    setPopoverOpen(false);
    setJustSaved(status);
    window.dispatchEvent(new CustomEvent("aniask:tracking-updated"));
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(null), 1600);
  };

  return (
    <article
      className="anime-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`View details for ${displayTitle}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); }
      }}
    >
      {/* Cover Media Container */}
      <div className="anime-card-media">
        <img
          src={coverUrl}
          alt={displayTitle}
          loading="lazy"
          className="anime-card-img"
        />

        {/* Dim overlay on hover (existing behaviour) */}
        <div className="anime-card-hover-overlay" />

        {/* Rank pill */}
        {rank !== undefined && (
          <div className={`anime-rank-pill anime-rank-pill--${rank}`}>#{rank}</div>
        )}

        {/* Score badge */}
        {anime.averageScore !== undefined && anime.averageScore !== null && (
          <div className={`anime-score-badge ${scoreColorClass}`}>
            <span className="material-symbols-outlined anime-score-icon">star</span>
            <span>{anime.averageScore}%</span>
          </div>
        )}

        {/* Format / Episodes */}
        {formatEpisodes() && (
          <div className="anime-format-tag">{formatEpisodes()}</div>
        )}

        {/* ── Current tracking badge (always visible when tracked) ── */}
        {currentStatus && !justSaved && (
          <div className={`card-track-badge ${STATUS_COLOR_CLASS[currentStatus]}`}>
            <span className="material-symbols-outlined">
              {STATUSES.find((s) => s.value === currentStatus)?.icon}
            </span>
          </div>
        )}

        {/* ── Save feedback flash ── */}
        {justSaved && (
          <div className="card-track-badge card-track-badge--saved">
            <span className="material-symbols-outlined">check</span>
          </div>
        )}

        {/* ── Backloggd-style quick action bar (appears on hover) ── */}
        <div
          className="anime-card-quick-actions"
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Plan to Watch — one-tap shortcut */}
          <button
            type="button"
            className={`card-qa-btn${currentStatus === "Planning" ? " card-qa-btn--active" : ""}`}
            title="Add to Plan to Watch"
            onClick={(e) => saveStatus("Planning", e)}
          >
            <span className="material-symbols-outlined">bookmark</span>
            <span>Plan</span>
          </button>

          {/* Status picker — opens a small popover */}
          <button
            type="button"
            className={`card-qa-btn${currentStatus && currentStatus !== "Planning" ? " card-qa-btn--active" : ""}${popoverOpen ? " card-qa-btn--open" : ""}`}
            title="Set watch status"
            onClick={(e) => { e.stopPropagation(); setPopoverOpen((o) => !o); }}
          >
            <span className="material-symbols-outlined">
              {currentStatus && currentStatus !== "Planning"
                ? STATUSES.find((s) => s.value === currentStatus)?.icon ?? "playlist_add_check"
                : "playlist_add_check"}
            </span>
            <span>{currentStatus && currentStatus !== "Planning" ? currentStatus : "Status"}</span>
          </button>

          {/* Status popover */}
          {popoverOpen && (
            <div className="card-status-popover">
              {STATUSES.map(({ value, icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`card-status-option${currentStatus === value ? " card-status-option--active" : ""}`}
                  onClick={(e) => saveStatus(value, e)}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                  {value}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Anime Info */}
      <div className="anime-card-body">
        <h3 className="anime-card-title" title={displayTitle}>{displayTitle}</h3>
        {subtitle && <p className="anime-card-subtitle" title={subtitle}>{subtitle}</p>}
        {anime.genres && anime.genres.length > 0 && (
          <div className="anime-card-genres">
            {anime.genres.slice(0, 3).map((genre) => (
              <span key={genre} className="genre-chip">{genre}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
