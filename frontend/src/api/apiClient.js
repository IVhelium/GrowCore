import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "/api";

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

  if (retryAfter) {
    return `Too many requests. Please try again in ${retryAfter} seconds.`;
  }

  return "Too many requests. Please wait a moment and try again.";
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

// function for verify access token
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

// Response Interceptor
apiClient.interceptors.response.use(
  (resp) => resp,           // Correct answer
  async (error) => {
    if ([409, 429].includes(error?.response?.status)) {
      notifyApiError(error);
    }

    if (shouldRefreshToken(error)) {
      const originalRequest = error.config;
      originalRequest._retry = true;

      try {
        await refreshAccessToken();
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Correcting the correct link for the media folder
export function resolvestorageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
