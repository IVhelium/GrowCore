import { apiClient } from "./apiClient";


export async function getUserProfile() {
    const { data } = await apiClient.get("/users/me");
    return data;
}

export async function updateUserProfile(payload) {
    const { data } = await apiClient.patch("/users/me", payload);
    return data;
}

export async function updateUserAvatar(payload) {
    const { data } = await apiClient.patch("/users/me/avatar", payload);
    return data;
}

export async function deletUserAvatar() {
    const { data } = await apiClient.delete("/users/me/avatar");
    return data;
}

export async function changeUserPassword(payload) {
    const { data } = await apiClient.patch("/users/me/password", payload);
    return data;
}