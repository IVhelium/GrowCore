import { apiClient } from "./apiClient";


export async function registerUser(payload) {
    const { data } = await apiClient.post("/auth/register", {
        username: payload.username,
        email: payload.email,
        password: payload.password,
    });
    return data;   
}

export async function loginUser(payload) {
    const { data } = await apiClient.post("/auth/login", {
        email: payload.email,
        password: payload.password,
    })
    return data;
}

export async function logoutUser() {
    const { data } = await apiClient.post("/auth/logout");
    return data;
}

export async function getCurrentUser() {
    const { data } = await apiClient.get("/auth/me");
    return data;
}