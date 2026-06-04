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
