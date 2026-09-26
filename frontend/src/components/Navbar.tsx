import type { PageTab } from "../types";

interface NavbarProps {
  activeTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
}

export default function Navbar({ activeTab, onSelectTab }: NavbarProps) {
  const navItems: { id: PageTab; label: string; icon: string }[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "chatbot", label: "Chatbot", icon: "forum" },
    { id: "mylist", label: "My List", icon: "bookmarks" },
  ];

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div
          className="navbar-brand"
          onClick={() => onSelectTab("home")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onSelectTab("home");
          }}
          title="Go to Home"
        >
          <img src="/logo.png" alt="AniAsk Logo" className="navbar-logo" />
          <div className="navbar-brand-info">
            <span className="navbar-title">AniAsk</span>
            <span className="navbar-badge">AI PORTAL</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-nav" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`navbar-tab ${isActive ? "navbar-tab--active" : ""}`}
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="material-symbols-outlined navbar-tab-icon">
                  {item.icon}
                </span>
                <span className="navbar-tab-label">{item.label}</span>
                {isActive && <span className="navbar-tab-indicator" />}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Two-sided Log In | Sign Up button */}
        <div className="navbar-actions">
          <div className="auth-split-btn" role="group" aria-label="User Authentication">
            <button
              type="button"
              className="auth-btn auth-btn--login"
              title="Log In"
            >
              <span className="material-symbols-outlined auth-btn-icon">
                login
              </span>
              <span>Log In</span>
            </button>
            <span className="auth-split-divider" aria-hidden="true" />
            <button
              type="button"
              className="auth-btn auth-btn--signup"
              title="Sign Up"
            >
              <span className="material-symbols-outlined auth-btn-icon">
                person_add
              </span>
              <span>Sign Up</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
