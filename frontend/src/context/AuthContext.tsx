import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMeApi,
  loginApi,
  logoutApi,
  refreshAccessTokenApi,
  registerApi,
  resendVerificationApi,
  verifyEmailApi,
} from "../api/auth";
import type {
  LoginPayload,
  RegisterPayload,
  User,
  VerifyEmailPayload,
} from "../types";

export type AuthModalMode = "login" | "register" | "verify";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isActionLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  pendingEmail: string;
  authError: string | null;
  authSuccess: string | null;
  setAuthError: (error: string | null) => void;
  setAuthSuccess: (msg: string | null) => void;
  openLogin: () => void;
  openRegister: () => void;
  openVerify: (email?: string) => void;
  closeAuthModal: () => void;
  switchAuthMode: (mode: AuthModalMode) => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const STORAGE_KEY = "aniask_access_token";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("login");
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const saveToken = useCallback((token: string | null) => {
    setAccessToken(token);
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Initial session restoration
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const storedToken = localStorage.getItem(STORAGE_KEY);
      const hasSession = localStorage.getItem("aniask_has_session") === "true";

      // If the user was never logged in or has logged out, skip refresh attempt
      if (!storedToken && !hasSession) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      if (storedToken) {
        try {
          const userData = await getMeApi(storedToken);
          if (isMounted) {
            setUser(userData);
            setIsLoading(false);
            return;
          }
        } catch {
          // Token expired or invalid, fall through to refresh attempt
        }
      }

      // Try cookie-based refresh only if a session was previously active
      try {
        const { accessToken: newToken } = await refreshAccessTokenApi();
        if (isMounted && newToken) {
          saveToken(newToken);
          localStorage.setItem("aniask_has_session", "true");
          const userData = await getMeApi(newToken);
          if (isMounted) {
            setUser(userData);
          }
        }
      } catch {
        // No valid session or refresh token expired
        if (isMounted) {
          saveToken(null);
          localStorage.removeItem("aniask_has_session");
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [saveToken]);


  const openLogin = useCallback(() => {
    setAuthError(null);
    setAuthSuccess(null);
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setAuthError(null);
    setAuthSuccess(null);
    setAuthModalMode("register");
    setIsAuthModalOpen(true);
  }, []);

  const openVerify = useCallback((email?: string) => {
    setAuthError(null);
    setAuthSuccess(null);
    if (email) setPendingEmail(email);
    setAuthModalMode("verify");
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError(null);
    setAuthSuccess(null);
  }, []);

  const switchAuthMode = useCallback((mode: AuthModalMode) => {
    setAuthError(null);
    setAuthSuccess(null);
    setAuthModalMode(mode);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsActionLoading(true);
      setAuthError(null);
      setAuthSuccess(null);

      try {
        const data = await loginApi(payload);
        saveToken(data.accessToken);
        localStorage.setItem("aniask_has_session", "true");

        // Fetch user profile
        const userData = await getMeApi(data.accessToken);
        setUser(userData);
        setIsAuthModalOpen(false);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to sign in";
        setAuthError(message);

        // If email needs verification, guide the user to verify
        if (message.toLowerCase().includes("verify your email")) {
          if (payload.email) {
            setPendingEmail(payload.email);
          }
        }
        throw err;
      } finally {
        setIsActionLoading(false);
      }
    },
    [saveToken]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsActionLoading(true);
      setAuthError(null);
      setAuthSuccess(null);

      try {
        const res = await registerApi(payload);
        setPendingEmail(payload.email);
        setAuthSuccess(
          res.message ||
            "Account created! We've sent a 6-digit verification code to your email."
        );
        // Seamlessly move user to verify screen
        setAuthModalMode("verify");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        setAuthError(message);
        throw err;
      } finally {
        setIsActionLoading(false);
      }
    },
    []
  );

  const verifyEmail = useCallback(
    async (payload: VerifyEmailPayload) => {
      setIsActionLoading(true);
      setAuthError(null);
      setAuthSuccess(null);

      try {
        const res = await verifyEmailApi(payload);
        setAuthSuccess(
          res.message || "Email verified successfully! You can now log in."
        );
        // Switch to login mode
        setAuthModalMode("login");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Verification failed";
        setAuthError(message);
        throw err;
      } finally {
        setIsActionLoading(false);
      }
    },
    []
  );

  const resendVerification = useCallback(async (email: string) => {
    setIsActionLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const res = await resendVerificationApi(email);
      setAuthSuccess(
        res.message || "Verification code sent! Please check your email inbox."
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to resend verification code";
      setAuthError(message);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsActionLoading(true);
    try {
      await logoutApi(accessToken);
    } catch (err) {
      console.warn("Logout request encountered error:", err);
    } finally {
      saveToken(null);
      localStorage.removeItem("aniask_has_session");
      setUser(null);
      setIsActionLoading(false);
    }
  }, [accessToken, saveToken]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { accessToken: newToken } = await refreshAccessTokenApi();
      if (newToken) {
        saveToken(newToken);
        const userData = await getMeApi(newToken);
        setUser(userData);
        return true;
      }
    } catch {
      saveToken(null);
      setUser(null);
    }
    return false;
  }, [saveToken]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user),
      isLoading,
      isActionLoading,
      isAuthModalOpen,
      authModalMode,
      pendingEmail,
      authError,
      authSuccess,
      setAuthError,
      setAuthSuccess,
      openLogin,
      openRegister,
      openVerify,
      closeAuthModal,
      switchAuthMode,
      login,
      register,
      verifyEmail,
      resendVerification,
      logout,
      refreshSession,
    }),
    [
      user,
      accessToken,
      isLoading,
      isActionLoading,
      isAuthModalOpen,
      authModalMode,
      pendingEmail,
      authError,
      authSuccess,
      openLogin,
      openRegister,
      openVerify,
      closeAuthModal,
      switchAuthMode,
      login,
      register,
      verifyEmail,
      resendVerification,
      logout,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
