interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const SUGGESTIONS = [
  {
    icon: "trending_up",
    label: "Trending",
    text: "What's the highest rated anime this season?",
  },
  {
    icon: "person_search",
    label: "Cast",
    text: "Who are the main voice actors in Steins;Gate?",
  },
  {
    icon: "explore",
    label: "Discover",
    text: "Find me isekai anime from the 2020s that finished airing",
  },
  {
    icon: "movie",
    label: "Studios",
    text: "What anime has Studio MAPPA produced?",
  },
];

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      {/* Ambient glow background */}
      <div className="welcome-glow welcome-glow-primary" />
      <div className="welcome-glow welcome-glow-secondary" />

      {/* Hero */}
      <div className="welcome-hero">
        <h2 className="welcome-title">AniAsk</h2>
        <p className="welcome-subtitle">
          Ask anything about anime ratings, cast, studios and more!
        </p>
      </div>

      {/* Suggestion cards */}
      <div className="suggestions-grid">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            className="suggestion-card"
            onClick={() => onSuggestionClick(s.text)}
          >
            <span className="material-symbols-outlined suggestion-icon">
              {s.icon}
            </span>
            <span className="suggestion-label">{s.label}</span>
            <span className="suggestion-text">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
