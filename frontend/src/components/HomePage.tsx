import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTopRatedAnime,
  getTrendingAnime,
  searchAnime,
} from "../api/anime";
import type { AnimeMedia } from "../types";
import AnimeCard from "./AnimeCard";
import AnimeDetailModal from "./AnimeDetailModal";

interface HomePageProps {
  onAskAI: (animeTitle: string) => void;
  onNavigateToChat: () => void;
}

export default function HomePage({
  onAskAI,
  onNavigateToChat,
}: HomePageProps) {
  // Trending state
  const [trending, setTrending] = useState<AnimeMedia[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  // Top Rated state
  const [topRated, setTopRated] = useState<AnimeMedia[]>([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  const [topRatedError, setTopRatedError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AnimeMedia[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected Anime for Detail Modal Popup
  const [selectedAnime, setSelectedAnime] = useState<AnimeMedia | null>(null);

  // Fetch trending
  const fetchTrending = useCallback(async () => {
    try {
      setTrendingLoading(true);
      setTrendingError(null);
      const data = await getTrendingAnime(5);
      setTrending(data);
    } catch (err) {
      setTrendingError(
        err instanceof Error ? err.message : "Failed to load trending anime"
      );
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  // Fetch top rated
  const fetchTopRated = useCallback(async () => {
    try {
      setTopRatedLoading(true);
      setTopRatedError(null);
      const data = await getTopRatedAnime(5);
      setTopRated(data);
    } catch (err) {
      setTopRatedError(
        err instanceof Error ? err.message : "Failed to load top rated anime"
      );
    } finally {
      setTopRatedLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchTrending();
    fetchTopRated();
  }, [fetchTrending, fetchTopRated]);

  // Execute search
  const executeSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      setSearchLoading(false);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      setHasSearched(true);
      const results = await searchAnime(trimmed, 10);
      setSearchResults(results);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Failed to execute search"
      );
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle typing with debounce
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!value.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      executeSearch(value);
    }, 450);
  };

  const handleClearSearch = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setSearchError(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    executeSearch(searchQuery);
  };

  // Render Skeleton Placeholders
  const renderSkeletons = (count = 5) => {
    return Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="anime-card anime-card--skeleton">
        <div className="skeleton-media" />
        <div className="skeleton-body">
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line skeleton-line--subtitle" />
          <div className="skeleton-line skeleton-line--tags" />
        </div>
      </div>
    ));
  };

  return (
    <div className="home-view">
      {/* Ambient background glows matching chatbot aesthetic */}
      <div className="welcome-glow welcome-glow-primary" />
      <div className="welcome-glow welcome-glow-secondary" />

      {/* Hero & Search Section */}
      <header className="home-hero">
        <div className="home-hero-badge">
          <span className="material-symbols-outlined home-hero-badge-icon">
            auto_awesome
          </span>
          <span>ANILIST POWERED ANIME EXPLORER</span>
        </div>

        <h1 className="home-hero-title">
          Discover Your Next Favorite Anime
        </h1>
        <p className="home-hero-subtitle">
          Explore trending shows, critically acclaimed masterpieces, and ask our
          AI assistant for personalized recommendations.
        </p>

        {/* Search Bar */}
        <form className="home-search-form" onSubmit={handleSearchSubmit}>
          <div className="home-search-container">
            <span className="material-symbols-outlined home-search-icon">
              search
            </span>
            <input
              type="text"
              className="home-search-input"
              placeholder="Search anime by title (e.g. Frieren, Attack on Titan, Jujutsu Kaisen)..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="home-search-clear-btn"
                onClick={handleClearSearch}
                title="Clear search"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
            <button
              type="submit"
              className="home-search-submit-btn"
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? (
                <span className="spinner-icon material-symbols-outlined">
                  progress_activity
                </span>
              ) : (
                <span>Search</span>
              )}
            </button>
          </div>
        </form>
      </header>

      {/* Search Results Section (Shown when user searched) */}
      {hasSearched && (
        <section className="home-section search-results-section">
          <div className="section-header">
            <div className="section-header-title-row">
              <span className="material-symbols-outlined section-icon">
                manage_search
              </span>
              <div>
                <h2 className="section-title">
                  Search Results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <p className="section-subtitle">
                  {searchResults.length} {searchResults.length === 1 ? "anime" : "animes"} found
                </p>
              </div>
            </div>
            <button
              type="button"
              className="section-clear-btn"
              onClick={handleClearSearch}
            >
              <span className="material-symbols-outlined">restart_alt</span>
              <span>Back to Trending</span>
            </button>
          </div>

          {searchLoading ? (
            <div className="anime-grid">{renderSkeletons(5)}</div>
          ) : searchError ? (
            <div className="home-error-state">
              <span className="material-symbols-outlined">error</span>
              <p>{searchError}</p>
              <button
                type="button"
                className="home-retry-btn"
                onClick={() => executeSearch(searchQuery)}
              >
                Retry Search
              </button>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="home-empty-search">
              <span className="material-symbols-outlined">search_off</span>
              <h3>No anime found</h3>
              <p>
                We couldn&apos;t find any anime matching &ldquo;{searchQuery}&rdquo;. Try
                checking for typos or searching a different keyword.
              </p>
            </div>
          ) : (
            <div className="anime-grid">
              {searchResults.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  onClick={() => setSelectedAnime(anime)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Trending Anime Section */}
      <section className="home-section">
        <div className="section-header">
          <div className="section-header-title-row">
            <span className="material-symbols-outlined section-icon section-icon--trending">
              local_fire_department
            </span>
            <div>
              <h2 className="section-title">Top 5 Trending Anime</h2>
              <p className="section-subtitle">
                The most watched and talked about titles right now
              </p>
            </div>
          </div>
          <span className="section-badge section-badge--trending">Trending Now</span>
        </div>

        {trendingLoading ? (
          <div className="anime-grid">{renderSkeletons(5)}</div>
        ) : trendingError ? (
          <div className="home-error-state">
            <span className="material-symbols-outlined">error</span>
            <p>{trendingError}</p>
            <button
              type="button"
              className="home-retry-btn"
              onClick={fetchTrending}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="anime-grid">
            {trending.map((anime, index) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                rank={index + 1}
                onClick={() => setSelectedAnime(anime)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Top Rated Anime Section */}
      <section className="home-section">
        <div className="section-header">
          <div className="section-header-title-row">
            <span className="material-symbols-outlined section-icon section-icon--top-rated">
              hotel_class
            </span>
            <div>
              <h2 className="section-title">Top 5 Highest Rated Anime</h2>
              <p className="section-subtitle">
                Legendary masterpieces with the highest community scores
              </p>
            </div>
          </div>
          <span className="section-badge section-badge--top-rated">All-Time Best</span>
        </div>

        {topRatedLoading ? (
          <div className="anime-grid">{renderSkeletons(5)}</div>
        ) : topRatedError ? (
          <div className="home-error-state">
            <span className="material-symbols-outlined">error</span>
            <p>{topRatedError}</p>
            <button
              type="button"
              className="home-retry-btn"
              onClick={fetchTopRated}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="anime-grid">
            {topRated.map((anime, index) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                rank={index + 1}
                onClick={() => setSelectedAnime(anime)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Interactive AI Callout Banner */}
      <section className="home-ai-callout">
        <div className="ai-callout-content">
          <div className="ai-callout-icon-box">
            <span className="material-symbols-outlined ai-callout-icon">
              psychology
            </span>
          </div>
          <div className="ai-callout-text">
            <h3>Can&apos;t decide what to watch next?</h3>
            <p>
              Ask AniAsk AI! Get custom tailored recommendations based on your taste,
              favorite tropes, voice actors, and studios.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="ai-callout-cta-btn"
          onClick={onNavigateToChat}
        >
          <span className="material-symbols-outlined">forum</span>
          <span>Open AI Chatbot</span>
        </button>
      </section>

      {/* Detail Modal Popup */}
      {selectedAnime && (
        <AnimeDetailModal
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
          onAskAI={(title) => {
            setSelectedAnime(null);
            onAskAI(title);
          }}
        />
      )}
    </div>
  );
}
