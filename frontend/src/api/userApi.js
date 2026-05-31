import { apiClient } from "./apiClient";


export async function getUserProfile() {
    const { data } = await apiClient.get("/users/me");
    return data;
}

export async function updateUserProfile(payload) {
    const body = {
        username: payload.username,
        description: payload.description || null,
    };

    const { data } = await apiClient.patch("/users/me", body);
    return data;
}

export async function uploadUserAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    const { data } = await apiClient.patch("/users/me/avatar", formData);
    return data;
}

export async function deleteUserAvatar() {
    const { data } = await apiClient.delete("/users/me/avatar");
    return data;
}

export async function searchUserByPublicId(publicId) {
    const { data } = await apiClient.get("/users/search", {
        params: { public_id: publicId },
    });

    return data;
}
