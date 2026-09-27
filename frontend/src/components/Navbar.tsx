import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { PageTab } from "../types";

interface NavbarProps {
  activeTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
}

export default function Navbar({ activeTab, onSelectTab }: NavbarProps) {
  const { user, isAuthenticated, openLogin, openRegister, openVerify, logout } =
    useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems: { id: PageTab; label: string; icon: string }[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "chatbot", label: "Chatbot", icon: "forum" },
    { id: "mylist", label: "My List", icon: "bookmarks" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        {/* Right Actions: Auth buttons or User Profile Dropdown */}
        <div className="navbar-actions">
          {isAuthenticated && user ? (
            <div className="auth-user-menu" ref={dropdownRef}>
              <button
                type="button"
                className={`auth-user-chip ${
                  isDropdownOpen ? "auth-user-chip--open" : ""
                }`}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                title={`${user.firstName} ${user.lastName}`}
              >
                <div className="auth-user-avatar">
                  {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                </div>
                <span className="auth-user-name">
                  {user.firstName || user.username}
                </span>
                {user.emailVerified && (
                  <span
                    className="material-symbols-outlined auth-verified-tick"
                    title="Verified account"
                  >
                    verified
                  </span>
                )}
                <span className="material-symbols-outlined auth-chevron-icon">
                  {isDropdownOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {isDropdownOpen && (
                <div className="auth-dropdown-panel" role="menu">
                  <div className="auth-dropdown-header">
                    <div className="auth-dropdown-avatar">
                      {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                    </div>
                    <div className="auth-dropdown-info">
                      <div className="auth-dropdown-fullname">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="auth-dropdown-username">
                        @{user.username}
                      </div>
                      <div className="auth-dropdown-email">{user.email}</div>
                    </div>
                  </div>

                  <div className="auth-dropdown-status-row">
                    {user.emailVerified ? (
                      <span className="auth-status-pill auth-status-pill--verified">
                        <span className="material-symbols-outlined">
                          verified
                        </span>
                        <span>Email Verified</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="auth-status-pill auth-status-pill--unverified"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          openVerify(user.email);
                        }}
                        title="Click to enter verification code"
                      >
                        <span className="material-symbols-outlined">
                          pending
                        </span>
                        <span>Unverified - Click to Verify</span>
                      </button>
                    )}
                  </div>

                  <div className="auth-dropdown-divider" />

                  <div className="auth-dropdown-actions">
                    <button
                      type="button"
                      className="auth-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onSelectTab("mylist");
                      }}
                    >
                      <span className="material-symbols-outlined">bookmarks</span>
                      <span>My Watchlist</span>
                    </button>

                    <button
                      type="button"
                      className="auth-dropdown-item auth-dropdown-item--logout"
                      role="menuitem"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                    >
                      <span className="material-symbols-outlined">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="auth-split-btn"
              role="group"
              aria-label="User Authentication"
            >
              <button
                type="button"
                className="auth-btn auth-btn--login"
                onClick={openLogin}
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
                onClick={openRegister}
                title="Sign Up"
              >
                <span className="material-symbols-outlined auth-btn-icon">
                  person_add
                </span>
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

