import { useEffect, useState } from "react";
import { getAnimeDetails } from "../api/anime";
import type { AnimeDetails, AnimeMedia, AnimeStartDate } from "../types";

interface AnimeDetailModalProps {
  anime: AnimeMedia;
  onClose: () => void;
  onAskAI: (animeTitle: string) => void;
}

function cleanDescription(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n[ \t]*\n[ \t]*\n+/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatDate(date?: AnimeStartDate | null): string {
  if (!date || !date.year) return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const m = date.month ? `${months[date.month - 1]} ` : "";
  const d = date.day ? `${date.day}, ` : "";
  return `${m}${d}${date.year}`;
}

export default function AnimeDetailModal({
  anime,
  onClose,
  onAskAI,
}: AnimeDetailModalProps) {
  const [details, setDetails] = useState<AnimeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch complete details on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getAnimeDetails(anime.id)
      .then((data) => {
        if (isMounted) {
          setDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch full details, using preview data:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [anime.id]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const displayTitle =
    details?.title.english ||
    anime.title.english ||
    details?.title.romaji ||
    anime.title.romaji ||
    anime.title.native ||
    "Unknown Anime";

  const subtitle =
    details?.title.romaji && details.title.romaji !== displayTitle
      ? details.title.romaji
      : anime.title.romaji !== displayTitle
      ? anime.title.romaji
      : "";

  const nativeTitle = details?.title.native || anime.title.native;

  const bannerUrl =
    details?.bannerImage ||
    anime.bannerImage ||
    details?.coverImage?.extraLarge ||
    anime.coverImage?.extraLarge;

  const posterUrl =
    details?.coverImage?.extraLarge ||
    details?.coverImage?.large ||
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    "https://via.placeholder.com/300x420/1e293b/94a3b8?text=No+Cover";

  // Studios
  const studioEdges = details?.studios?.edges || [];
  const mainStudio =
    studioEdges.find((edge) => edge.isMain)?.node.name ||
    studioEdges[0]?.node.name;
  const producerStudios = studioEdges
    .filter((edge) => !edge.isMain && edge.node.name !== mainStudio)
    .map((edge) => edge.node.name);

  // Characters & Voice Actors
  const characterEdges = details?.characters?.edges || [];

  // Metadata
  const score = details?.averageScore ?? anime.averageScore;
  const meanScore = details?.meanScore;
  const format = details?.format || anime.format || "TV";
  const episodes = details?.episodes ?? anime.episodes;
  const duration = details?.duration;
  const status = details?.status || anime.status || "FINISHED";
  const season = details?.season
    ? `${details.season} ${details.seasonYear || ""}`.trim()
    : anime.startDate?.year
    ? `${anime.startDate.year}`
    : null;

  const startDateStr = formatDate(details?.startDate || anime.startDate);
  const endDateStr = formatDate(details?.endDate);
  const popularity = details?.popularity || anime.popularity;

  const genres = details?.genres || anime.genres || [];
  const rawDescription = details?.description || anime.description;
  const description = cleanDescription(rawDescription);

  const anilistUrl = `https://anilist.co/anime/${anime.id}`;

  return (
    <div
      className="anime-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="anime-modal-title"
    >
      <div
        className="anime-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Area */}
        <div className="anime-modal-banner-container">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={`${displayTitle} banner`}
              className="anime-modal-banner-img"
            />
          ) : (
            <div className="anime-modal-banner-placeholder" />
          )}
          <div className="anime-modal-banner-gradient" />

          {/* Close button */}
          <button
            type="button"
            className="anime-modal-close-btn"
            onClick={onClose}
            title="Close popup (Esc)"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="anime-modal-content">
          {/* Header Row: Poster thumbnail & Main titles */}
          <div className="anime-modal-header-row">
            <img
              src={posterUrl}
              alt={displayTitle}
              className="anime-modal-poster-img"
            />

            <div className="anime-modal-title-block">
              <h2 id="anime-modal-title" className="anime-modal-title">
                {displayTitle}
              </h2>
              {subtitle && (
                <p className="anime-modal-subtitle">{subtitle}</p>
              )}
              {nativeTitle && nativeTitle !== displayTitle && (
                <p className="anime-modal-native-title">{nativeTitle}</p>
              )}

              {/* Key metadata badges */}
              <div className="anime-modal-meta-pills">
                {score !== undefined && score !== null && (
                  <span className="modal-pill modal-pill--score">
                    <span className="material-symbols-outlined modal-pill-icon">
                      star
                    </span>
                    <span>{score}% Score</span>
                  </span>
                )}

                {mainStudio ? (
                  <span className="modal-pill modal-pill--studio">
                    <span className="material-symbols-outlined modal-pill-icon">
                      movie
                    </span>
                    <span>{mainStudio}</span>
                  </span>
                ) : loading ? (
                  <span className="modal-pill modal-pill--loading">
                    <span className="spinner-icon material-symbols-outlined">
                      progress_activity
                    </span>
                    <span>Loading studio...</span>
                  </span>
                ) : null}

                <span className="modal-pill modal-pill--info">
                  <span className="material-symbols-outlined modal-pill-icon">
                    tv
                  </span>
                  <span>
                    {format}
                    {episodes ? ` • ${episodes} eps` : ""}
                    {duration ? ` (${duration}m)` : ""}
                  </span>
                </span>

                {season && (
                  <span className="modal-pill modal-pill--season">
                    <span className="material-symbols-outlined modal-pill-icon">
                      calendar_month
                    </span>
                    <span>{season}</span>
                  </span>
                )}

                <span className="modal-pill modal-pill--status">
                  <span className="material-symbols-outlined modal-pill-icon">
                    info
                  </span>
                  <span>{status}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Key Specs Statistics Bar */}
          <div className="anime-modal-stats-bar">
            {score !== undefined && (
              <div className="stat-card">
                <span className="stat-label">Community Rating</span>
                <span className="stat-value text-accent-green">
                  {score}% {meanScore ? `(Mean: ${meanScore}%)` : ""}
                </span>
              </div>
            )}

            {popularity !== undefined && popularity !== null && (
              <div className="stat-card">
                <span className="stat-label">Popularity</span>
                <span className="stat-value">
                  {popularity.toLocaleString()} members
                </span>
              </div>
            )}

            {startDateStr && (
              <div className="stat-card">
                <span className="stat-label">Airing Period</span>
                <span className="stat-value">
                  {startDateStr}
                  {endDateStr ? ` – ${endDateStr}` : status === "RELEASING" ? " (Ongoing)" : ""}
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
              {genres.map((genre) => (
                <span key={genre} className="genre-chip genre-chip--lg">
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          <div className="anime-modal-synopsis-section">
            <div className="synopsis-header">
              <span className="material-symbols-outlined synopsis-icon">
                description
              </span>
              <h3>Synopsis</h3>
            </div>
            {loading && !rawDescription ? (
              <div className="synopsis-skeleton-container">
                <div className="skeleton-line skeleton-line--synopsis-1" />
                <div className="skeleton-line skeleton-line--synopsis-2" />
                <div className="skeleton-line skeleton-line--synopsis-3" />
              </div>
            ) : (
              <p className="synopsis-text">
                {description || "No description available for this anime."}
              </p>
            )}
          </div>

          {/* Characters & Voice Actors Section */}
          <div className="anime-modal-characters-section">
            <div className="section-title-row">
              <span className="material-symbols-outlined section-title-icon">
                record_voice_over
              </span>
              <h3>Characters & Voice Actors</h3>
            </div>

            {loading ? (
              <div className="characters-grid">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="character-va-card character-va-card--skeleton">
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
              <p className="section-empty-hint">
                No character or voice actor records available.
              </p>
            ) : (
              <div className="characters-grid">
                {characterEdges.slice(0, 8).map((edge, idx) => {
                  const character = edge.node;
                  const va = edge.voiceActors?.[0]; // Primary (Japanese) voice actor
                  const charImg =
                    character.image?.large ||
                    character.image?.medium ||
                    "https://via.placeholder.com/80x100/1e293b/94a3b8?text=Char";
                  const vaImg = va?.image?.large || va?.image?.medium;

                  return (
                    <div
                      key={character.id || idx}
                      className="character-va-card"
                    >
                      {/* Character Column */}
                      <div className="char-side">
                        <img
                          src={charImg}
                          alt={character.name.full}
                          loading="lazy"
                          className="char-avatar"
                        />
                        <div className="char-info">
                          <p className="char-name" title={character.name.full}>
                            {character.name.full}
                          </p>
                          <span
                            className={`char-role-badge ${
                              edge.role === "MAIN"
                                ? "char-role-badge--main"
                                : "char-role-badge--supporting"
                            }`}
                          >
                            {edge.role || "Character"}
                          </span>
                        </div>
                      </div>

                      {/* Voice Actor Column */}
                      {va && (
                        <div className="va-side">
                          <div className="va-info">
                            <p className="va-name" title={va.name.full}>
                              {va.name.full}
                            </p>
                            <span className="va-lang-tag">Japanese VA</span>
                          </div>
                          {vaImg ? (
                            <img
                              src={vaImg}
                              alt={va.name.full}
                              loading="lazy"
                              className="va-avatar"
                            />
                          ) : (
                            <div className="va-avatar-placeholder">
                              <span className="material-symbols-outlined">
                                person
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Studios & Production Staff Section */}
          {(mainStudio || producerStudios.length > 0) && (
            <div className="anime-modal-studios-section">
              <div className="section-title-row">
                <span className="material-symbols-outlined section-title-icon">
                  movie_creation
                </span>
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

          {/* Action Buttons */}
          <div className="anime-modal-actions-bar">
            {/* Ask AI button */}
            <button
              type="button"
              className="modal-action-btn modal-action-btn--ask"
              onClick={() => onAskAI(displayTitle)}
              title={`Ask AniAsk AI about ${displayTitle}`}
            >
              <span className="material-symbols-outlined">smart_toy</span>
              <span>Ask AI About This Anime</span>
            </button>

            {/* View on AniList button */}
            <a
              href={anilistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-action-btn modal-action-btn--anilist"
              title="Open full page on AniList"
            >
              <span className="material-symbols-outlined">open_in_new</span>
              <span>View on AniList</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
