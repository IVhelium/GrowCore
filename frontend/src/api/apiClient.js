import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL || "/api";

function normalizeApiUrl(url) {
  return url.replace(/\/+$/, "");
}

function getApiUrl() {
  return normalizeApiUrl(configuredApiUrl);
}

export const API_URL = getApiUrl();

export function getWebSocketUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const configuredWebSocketUrl =
    import.meta.env.VITE_WS_URL;

  if (!configuredWebSocketUrl && !isLocalHost && API_URL.startsWith("/")) {
    throw new Error("VITE_WS_URL must be configured for production WebSockets");
  }

  if (configuredWebSocketUrl) {
    const wsUrl = new URL(normalizeApiUrl(configuredWebSocketUrl));
    if (wsUrl.protocol === "https:") wsUrl.protocol = "wss:";
    if (wsUrl.protocol === "http:") wsUrl.protocol = "ws:";
    wsUrl.pathname = `${wsUrl.pathname.replace(/\/$/, "")}${normalizedPath}`;
    return wsUrl.toString();
  }

  if (/^https?:\/\//i.test(API_URL)) {
    const apiUrl = new URL(API_URL);
    apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    apiUrl.pathname = `${apiUrl.pathname.replace(/\/$/, "")}${normalizedPath}`;
    return apiUrl.toString();
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${API_URL.replace(/\/$/, "")}${normalizedPath}`;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});

const REFRESH_ENDPOINT = "/auths/refresh";

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

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => item.msg || "Invalid value").join(". ");
  }

  if (retryAfter) {
    return `Too many requests. Please try again in ${retryAfter} seconds.`;
  }

  if (error?.code === "ERR_NETWORK") {
    return "Cannot connect to the server";
  }

  const status = error?.response?.status;

  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  if (status === 404) {
    return "Requested item was not found.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 401) {
    return "Please sign in to continue.";
  }

  return "Something went wrong. Please try again.";
}

function shouldNotifyApiError(error) {
  const status = error?.response?.status;
  const requestUrl = error?.config?.url || "";

  if (error?.config?._silent) {
    return false;
  }

  if (!status && error?.code !== "ERR_NETWORK") {
    return false;
  }

  if (status === 401 && requestUrl.includes("/auths/me")) {
    return false;
  }

  if (requestUrl.includes(REFRESH_ENDPOINT)) {
    return false;
  }

  return !status || status >= 400;
}

function notifyApiError(error) {
  if (typeof window === "undefined") {
    return;
  }

  const now = Date.now();

  if (now - lastApiNoticeAt < 1500) {
    return;
  }

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

  if (
    status !== 401 ||
    !request ||
    request._retry ||
    request._skipAuthRefresh
  ) {
    return false;
  }

  return !AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) =>
    requestUrl.includes(endpoint),
  );
}

async function refreshAccessToken() {
  if (!refreshRequest) {
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
      originalRequest._retry = true;

      try {
        await refreshAccessToken();
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (shouldNotifyApiError(refreshError)) {
          notifyApiError(refreshError);
        }

        return Promise.reject(refreshError);
      }
    }

    if (shouldNotifyApiError(error)) {
      notifyApiError(error);
    }

    return Promise.reject(error);
  },
);

// Shared React Query client configuration.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Backend storage path to browser-accessible media URL
export function resolvestorageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getPaginationParams({ limit = 20, offset = 0 } = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const safeOffset = Math.max(0, Number(offset) || 0);

  return {
    limit: safeLimit,
    offset: safeOffset,
  };
}
