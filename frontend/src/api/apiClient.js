import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL || "/api"; // Uses /api when no environment URL is set.

function normalizeApiUrl(url) {
  return url.replace(/\/+$/, ""); // Removes trailing slashes.
}

function getApiUrl() {
  return normalizeApiUrl(configuredApiUrl);
}

export const API_URL = getApiUrl();

export function getWebSocketUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`; // Ensures the endpoint starts with /.
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname); // Detects local development.
  const configuredWebSocketUrl = import.meta.env.VITE_WS_URL; // Optional separate WebSocket URL.

  if (!configuredWebSocketUrl && !isLocalHost && API_URL.startsWith("/")) { // Production needs a full socket URL.
    throw new Error("VITE_WS_URL must be configured for production WebSockets");
  }

  if (configuredWebSocketUrl) {
    const wsUrl = new URL(normalizeApiUrl(configuredWebSocketUrl));
    if (wsUrl.protocol === "https:") wsUrl.protocol = "wss:"; // Converts HTTPS to secure WebSocket.
    if (wsUrl.protocol === "http:") wsUrl.protocol = "ws:"; // Converts HTTP to WebSocket.
    const configuredPath = wsUrl.pathname.replace(/\/$/, "");
    wsUrl.pathname = configuredPath.endsWith(normalizedPath)
      ? configuredPath
      : normalizedPath; // Avoids duplicating the endpoint path.
    return wsUrl.toString();
  }

  if (/^https?:\/\//i.test(API_URL)) { // Checks whether API_URL is a complete HTTP(S) URL.
    const apiUrl = new URL(API_URL);
    apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:"; // Selects the matching socket protocol.
    apiUrl.pathname = `${apiUrl.pathname.replace(/\/$/, "")}${normalizedPath}`;
    return apiUrl.toString();
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"; // Uses wss on HTTPS pages.
  return `${protocol}//${window.location.host}${API_URL.replace(/\/$/, "")}${normalizedPath}`;
}

export const apiClient = axios.create({
  baseURL: API_URL, // Prefix added to relative API endpoints.
  withCredentials: true, // Sends authentication cookies.
  timeout: 10000, // Stops requests after ten seconds.
  headers: {
    Accept: "application/json",
  },
});

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim()) // Removes spaces after semicolons.
    .find((part) => part.startsWith(prefix)); // Finds the requested cookie.

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null; // Returns null when it does not exist.
}

apiClient.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (!["post", "put", "patch", "delete"].includes(method)) return config; // Only write requests need CSRF protection.

  const isRefreshRequest = (config.url || "").includes("/auths/refresh");
  const csrfToken = readCookie(
    isRefreshRequest ? "csrf_refresh_token" : "csrf_access_token", // Refresh requests use their own CSRF cookie.
  );

  if (csrfToken) config.headers.set("X-CSRF-TOKEN", csrfToken); // Sends the token expected by the backend.

  return config;
});

const REFRESH_ENDPOINT = "/auths/refresh"; // Creates a new access token from the refresh cookie.

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  "/auths/login",
  "/auths/logout",
  "/auths/register",
  REFRESH_ENDPOINT,
];

let refreshRequest = null;
let lastApiNoticeAt = 0;

function getApiNoticeMessage(error) {
  const retryAfter = error?.response?.headers?.["retry-after"];
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) return detail; // Prefers a readable backend message.

  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => item.msg || "Invalid value").join(". ");
  }

  if (retryAfter) return `Too many requests. Please try again in ${retryAfter} seconds.`;
  if (error?.code === "ERR_NETWORK") return "Cannot connect to the server";

  const status = error?.response?.status;
  if (status >= 500) return "Server error. Please try again later.";
  if (status === 404) return "Requested item was not found.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 401) return "Please sign in to continue.";

  return "Something went wrong. Please try again.";
}

function shouldNotifyApiError(error) {
  const status = error?.response?.status;
  const requestUrl = error?.config?.url || "";

  if (error?.config?._silent) return false; // Background requests manage their own errors.
  if (!status && error?.code !== "ERR_NETWORK") return false; // Ignores cancelled or unknown errors.
  if (status === 401 && requestUrl.includes("/auths/me")) return false; // Visitors do not have a session yet.
  if (requestUrl.includes(REFRESH_ENDPOINT)) return false; // Avoids duplicate refresh errors.

  return !status || status >= 400;
}

function notifyApiError(error) {
  if (typeof window === "undefined") return; // Server rendering cannot display browser toasts.

  const now = Date.now();
  if (now - lastApiNoticeAt < 1500) return; // Prevents duplicate error toasts.

  lastApiNoticeAt = now;
  window.dispatchEvent(
    new CustomEvent("growcore:api-notice", {
      detail: {
        message: getApiNoticeMessage(error),
      },
    }),
  );
}

function shouldRefreshToken(error) {
  const status = error?.response?.status;
  const request = error?.config;
  const requestUrl = request?.url || "";

  if (status !== 401 || !request || request._retry || request._skipAuthRefresh) return false;

  return !AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) =>
    requestUrl.includes(endpoint),
  ); // Does not refresh after authentication endpoints.
}

async function refreshAccessToken() {
  if (!refreshRequest) { // Reuses one refresh request when several calls receive 401.
    refreshRequest = apiClient
      .post(REFRESH_ENDPOINT, null, { _skipAuthRefresh: true })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

apiClient.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    if (shouldRefreshToken(error)) {
      const originalRequest = error.config;
      originalRequest._retry = true; // Prevents an endless retry loop.

      try {
        await refreshAccessToken();
        return apiClient(originalRequest); // Repeats the original call with a new access token.
      } catch (refreshError) {
        if (shouldNotifyApiError(refreshError)) notifyApiError(refreshError);
        return Promise.reject(refreshError);
      }
    }

    if (shouldNotifyApiError(error)) notifyApiError(error);
    return Promise.reject(error);
  },
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Repeats a failed query once.
      refetchOnWindowFocus: false, // Does not reload data whenever the tab regains focus.
    },
  },
});

export function resolvestorageUrl(path) {
  if (!path) return null; // No path means there is no media file.
  if (/^https?:\/\//i.test(path)) return path; // Leaves a full HTTP(S) URL unchanged.

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getPaginationParams({ limit = 20, offset = 0 } = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20)); // Limits page size to 1–100.
  const safeOffset = Math.max(0, Number(offset) || 0); // Prevents a negative offset.

  return {
    limit: safeLimit,
    offset: safeOffset,
  };
}
