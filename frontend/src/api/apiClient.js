import axios from "axios";

export const apiClient = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
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