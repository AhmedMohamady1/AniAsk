import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    pendingEmail,
    authError,
    authSuccess,
    isActionLoading,
    closeAuthModal,
    switchAuthMode,
    login,
    register,
    verifyEmail,
    resendVerification,
    setAuthError,
  } = useAuth();

  // Form states for Login
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states for Register
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Form states for Verify OTP
  const [verifyEmailInput, setVerifyEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Synchronize pendingEmail with verifyEmailInput
  useEffect(() => {
    if (pendingEmail) {
      setVerifyEmailInput(pendingEmail);
    }
  }, [pendingEmail]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Cooldown countdown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  // Login submission
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setAuthError("Please enter your username or email");
      return;
    }
    if (!loginPassword) {
      setAuthError("Please enter your password");
      return;
    }

    const isEmail = identifier.includes("@");
    try {
      await login({
        email: isEmail ? identifier : undefined,
        username: !isEmail ? identifier : undefined,
        password: loginPassword,
      });
      // Clear password on successful login
      setLoginPassword("");
    } catch {
      // Error handled in AuthContext
    }
  };

  // Register submission
  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const firstName = regFirstName.trim();
    const lastName = regLastName.trim();
    const username = regUsername.trim();
    const email = regEmail.trim();

    if (firstName.length < 2) {
      setAuthError("First name must be at least 2 characters");
      return;
    }
    if (lastName.length < 2) {
      setAuthError("Last name must be at least 2 characters");
      return;
    }
    if (username.length < 5) {
      setAuthError("Username must be at least 5 characters");
      return;
    }
    if (!email || !email.includes("@")) {
      setAuthError("Please enter a valid email address");
      return;
    }
    if (regPassword.length < 8) {
      setAuthError("Password must be at least 8 characters");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    try {
      await register({
        firstName,
        lastName,
        username,
        email,
        password: regPassword,
      });
      // Pre-fill email for verification
      setVerifyEmailInput(email);
      setResendCooldown(60);
    } catch {
      // Error handled in AuthContext
    }
  };

  // Verify OTP submission
  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    const email = verifyEmailInput.trim();
    const otp = otpCode.trim();

    if (!email) {
      setAuthError("Email is required for verification");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setAuthError("Verification code must be exactly 6 digits");
      return;
    }

    try {
      await verifyEmail({
        email,
        otp,
      });
      // After verification, prepopulate login
      setLoginIdentifier(email);
      setOtpCode("");
    } catch {
      // Error handled in AuthContext
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isActionLoading) return;
    const email = verifyEmailInput.trim();
    if (!email) {
      setAuthError("Please provide your email to resend code");
      return;
    }
    try {
      await resendVerification(email);
      setResendCooldown(60);
    } catch {
      // Error handled in AuthContext
    }
  };

  return (
    <div
      className="auth-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-modal-card">
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={closeAuthModal}
          title="Close dialog (Esc)"
          aria-label="Close dialog"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Brand Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-logo-wrapper">
            <img src="/logo.png" alt="AniAsk Logo" className="auth-modal-logo" />
            <span className="auth-brand-badge">PORTAL</span>
          </div>

          <h2 id="auth-modal-title" className="auth-modal-title">
            {authModalMode === "login" && "Welcome Back"}
            {authModalMode === "register" && "Join AniAsk"}
            {authModalMode === "verify" && "Verify Your Email"}
          </h2>

          <p className="auth-modal-subtitle">
            {authModalMode === "login" &&
              "Sign in to track anime, personalize recommendations, and sync chats."}
            {authModalMode === "register" &&
              "Create an account to unlock your personal watchlist and AI companion."}
            {authModalMode === "verify" &&
              "Enter the 6-digit confirmation code we sent to your inbox."}
          </p>
        </div>

        {/* Global Notifications */}
        {authError && (
          <div className="auth-alert auth-alert--error" role="alert">
            <span className="material-symbols-outlined auth-alert-icon">
              error
            </span>
            <span className="auth-alert-text">{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div className="auth-alert auth-alert--success" role="status">
            <span className="material-symbols-outlined auth-alert-icon">
              check_circle
            </span>
            <span className="auth-alert-text">{authSuccess}</span>
          </div>
        )}

        {/* Mode: LOGIN */}
        {authModalMode === "login" && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="auth-input-group">
              <label htmlFor="login-identifier" className="auth-label">
                Username or Email
              </label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-outlined auth-input-icon">
                  person
                </span>
                <input
                  id="login-identifier"
                  type="text"
                  className="auth-input"
                  placeholder="username or you@example.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-label-row">
                <label htmlFor="login-password" className="auth-label">
                  Password
                </label>
              </div>
              <div className="auth-input-wrapper">
                <span className="material-symbols-outlined auth-input-icon">
                  lock
                </span>
                <input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  title={showLoginPassword ? "Hide password" : "Show password"}
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined">
                    {showLoginPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <span className="material-symbols-outlined spinner-icon">
                    progress_activity
                  </span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => switchAuthMode("register")}
                >
                  Create one now
                </button>
              </p>
              <button
                type="button"
                className="auth-link-secondary"
                onClick={() => switchAuthMode("verify")}
              >
                Need to verify an existing account?
              </button>
            </div>
          </form>
        )}

        {/* Mode: REGISTER */}
        {authModalMode === "register" && (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="auth-grid-2">
              <div className="auth-input-group">
                <label htmlFor="reg-first-name" className="auth-label">
                  First Name
                </label>
                <div className="auth-input-wrapper">
                  <span className="material-symbols-outlined auth-input-icon">
                    badge
                  </span>
                  <input
                    id="reg-first-name"
                    type="text"
                    className="auth-input"
                    placeholder="Shinji"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="reg-last-name" className="auth-label">
                  Last Name
                </label>
                <div className="auth-input-wrapper">
                  <span className="material-symbols-outlined auth-input-icon">
                    badge
                  </span>
                  <input
                    id="reg-last-name"
                    type="text"
                    className="auth-input"
                    placeholder="Ikari"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-username" className="auth-label">
                Username
              </label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-outlined auth-input-icon">
                  alternate_email
                </span>
                <input
                  id="reg-username"
                  type="text"
                  className="auth-input"
                  placeholder="evapilot01"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  minLength={5}
                  maxLength={50}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-email" className="auth-label">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-outlined auth-input-icon">
                  mail
                </span>
                <input
                  id="reg-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@domain.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>
            </div>

            <div className="auth-grid-2">
              <div className="auth-input-group">
                <label htmlFor="reg-password" className="auth-label">
                  Password
                </label>
                <div className="auth-input-wrapper">
                  <span className="material-symbols-outlined auth-input-icon">
                    lock
                  </span>
                  <input
                    id="reg-password"
                    type={showRegPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="Min. 8 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="reg-confirm-password" className="auth-label">
                  Confirm
                </label>
                <div className="auth-input-wrapper">
                  <span className="material-symbols-outlined auth-input-icon">
                    lock_reset
                  </span>
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="Repeat"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    title={showRegPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined">
                      {showRegPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <span className="material-symbols-outlined spinner-icon">
                    progress_activity
                  </span>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Already registered?{" "}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => switchAuthMode("login")}
                >
                  Log in here
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Mode: VERIFY EMAIL */}
        {authModalMode === "verify" && (
          <form className="auth-form" onSubmit={handleVerifySubmit}>
            <div className="auth-input-group">
              <label htmlFor="verify-email" className="auth-label">
                Target Email Address
              </label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-outlined auth-input-icon">
                  mail
                </span>
                <input
                  id="verify-email"
                  type="email"
                  className="auth-input"
                  placeholder="your-email@example.com"
                  value={verifyEmailInput}
                  onChange={(e) => setVerifyEmailInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-label-row">
                <label htmlFor="verify-otp" className="auth-label">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  className="auth-resend-btn"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isActionLoading}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Code"}
                </button>
              </div>

              <div className="auth-input-wrapper">
                <span className="material-symbols-outlined auth-input-icon">
                  key
                </span>
                <input
                  id="verify-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="auth-input auth-input--otp"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(val);
                  }}
                  autoFocus
                  required
                />
              </div>
              <p className="auth-hint-text">
                Check your spam folder if the code doesn't appear within 2
                minutes.
              </p>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isActionLoading || otpCode.length !== 6}
            >
              {isActionLoading ? (
                <>
                  <span className="material-symbols-outlined spinner-icon">
                    progress_activity
                  </span>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">
                    check_circle
                  </span>
                  <span>Verify Email</span>
                </>
              )}
            </button>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Verified already?{" "}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => switchAuthMode("login")}
                >
                  Proceed to Log In
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
