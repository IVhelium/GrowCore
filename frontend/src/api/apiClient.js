import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const API_URL = "http://localhost:8000";

export const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 10000,
    headers: {
        "Accept": "application/json",
    },
});

// Перехвотчик ответов
apiClient.interceptors.response.use(
    (resp) => resp,                                 // Успешный ответ
    (error) => {
        const status = error?.response?.status;     // Ответ с Ошибкой

        if (status === 401) {
            console.warn("User is not autorized");
        }

        return Promise.reject(error);
    }
)

// React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Корректировка правильной ссылки для папки медиа
export function resolveMediaUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;

    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}