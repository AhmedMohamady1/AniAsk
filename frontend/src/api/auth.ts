/**
 * API client for interacting with AniAsk backend authentication endpoints.
 * Integrates with /auth/register, /auth/login, /auth/me, /auth/refresh,
 * /auth/logout, /auth/verify-email, and /auth/resend-verification.
 */

import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  VerifyEmailPayload,
} from "../types";

export const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL !== undefined
    ? import.meta.env.VITE_BACKEND_URL
    : import.meta.env.DEV
    ? ""
    : "https://aniask.onrender.com";


/**
 * Extracts a readable error message from API response JSON.
 */
async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
    if (typeof data?.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }
  } catch {
    // Response was not JSON
  }
  return `Request failed with status ${response.status} (${response.statusText})`;
}

/**
 * Registers a new user account.
 * On success, backend sends a 6-digit OTP code to the provided email.
 */
export async function registerApi(
  payload: RegisterPayload
): Promise<{ message: string; user: User }> {
  const response = await fetch(`${BACKEND_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Logs in an existing user with username/email and password.
 * Returns an access token and sets an httpOnly refresh token cookie.
 */
export async function loginApi(
  payload: LoginPayload
): Promise<{ success: boolean; accessToken: string }> {
  const response = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Fetches the currently authenticated user's profile using the access token.
 */
export async function getMeApi(accessToken: string): Promise<User> {
  const response = await fetch(`${BACKEND_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Refreshes the access token using the httpOnly refresh-token cookie.
 */
export async function refreshAccessTokenApi(): Promise<{
  accessToken: string;
}> {
  const response = await fetch(`${BACKEND_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Logs the user out, revoking the refresh token and clearing cookies.
 */
export async function logoutApi(
  accessToken?: string | null
): Promise<{ success: boolean; message: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BACKEND_BASE_URL}/auth/logout`, {
    method: "POST",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Verifies the user's email with a 6-digit OTP code.
 */
export async function verifyEmailApi(
  payload: VerifyEmailPayload
): Promise<AuthResponse> {
  const response = await fetch(`${BACKEND_BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Resends the 6-digit verification code to the given email address.
 */
export async function resendVerificationApi(
  email: string
): Promise<AuthResponse> {
  const response = await fetch(`${BACKEND_BASE_URL}/auth/resend-verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}
