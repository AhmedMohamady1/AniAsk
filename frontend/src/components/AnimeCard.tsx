import type { AnimeMedia } from "../types";

interface AnimeCardProps {
  anime: AnimeMedia;
  rank?: number;
  onClick?: () => void;
}

export default function AnimeCard({ anime, rank, onClick }: AnimeCardProps) {
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

  return (
    <article
      className="anime-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`View details for ${displayTitle}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
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

        {/* Hover Quick View Overlay */}
        <div className="anime-card-hover-overlay">
          <span className="material-symbols-outlined">info</span>
          <span>View Details</span>
        </div>

        {/* Rank Overlay */}
        {rank !== undefined && (
          <div className={`anime-rank-pill anime-rank-pill--${rank}`}>
            #{rank}
          </div>
        )}

        {/* Score Overlay */}
        {anime.averageScore !== undefined && anime.averageScore !== null && (
          <div className={`anime-score-badge ${scoreColorClass}`}>
            <span className="material-symbols-outlined anime-score-icon">
              star
            </span>
            <span>{anime.averageScore}%</span>
          </div>
        )}

        {/* Format / Episodes overlay */}
        {formatEpisodes() && (
          <div className="anime-format-tag">{formatEpisodes()}</div>
        )}
      </div>

      {/* Anime Info */}
      <div className="anime-card-body">
        <h3 className="anime-card-title" title={displayTitle}>
          {displayTitle}
        </h3>
        {subtitle && (
          <p className="anime-card-subtitle" title={subtitle}>
            {subtitle}
          </p>
        )}

        {/* Genres Chips */}
        {anime.genres && anime.genres.length > 0 && (
          <div className="anime-card-genres">
            {anime.genres.slice(0, 3).map((genre) => (
              <span key={genre} className="genre-chip">
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
