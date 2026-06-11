import { apiClient } from "./apiClient";
import { getPaginationParams } from "./apiClient";


export function normalizeUser(user) {
    return {
        ...user,
        public_id: user.public_id,
        publicId: user.public_id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        avatarUrl: user.avatar_url,
        isBlocked: Boolean(user.is_blocked),
        blockReason: user.block_reason || null,
    };
}


export async function getUserProfile() {
    const { data } = await apiClient.get("/users/me");
    return normalizeUser(data);
}

export async function updateUserProfile(payload) {
    const body = {
        username: payload.username,
        description: payload.description || null,
    };

    const { data } = await apiClient.patch("/users/me", body);
    return normalizeUser(data);
}

export async function uploadUserAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    const { data } = await apiClient.patch("/users/me/avatar", formData);
    return normalizeUser(data);
}

export async function deleteUserAvatar() {
    const { data } = await apiClient.delete("/users/me/avatar");
    return normalizeUser(data);
}

export async function getUsers({ limit = 12, offset = 0 } = {}) {
    const { data } = await apiClient.get("/users", {
        params: getPaginationParams({ limit, offset }),
    });

    return {
        ...data,
        items: (data.items || []).map(normalizeUser),
    };
}

export async function searchUserByPublicId(publicId) {
    const { data } = await apiClient.get("/users/search", {
        params: { public_id: publicId },
    });

    return normalizeUser(data);
}

export async function getPublicUserProfile(publicId) {
    const { data } = await apiClient.get(`/users/${encodeURIComponent(publicId)}`);
    return normalizeUser(data);
}

export async function getFollowingStatus(publicId) {
    const { data } = await apiClient.get(
        `/users/${encodeURIComponent(publicId)}/following`,
        { _silent: true },
    );
    return Boolean(data?.is_following);
}

export async function followUser(publicId) {
    const { data } = await apiClient.post(
        `/users/${encodeURIComponent(publicId)}/follow`,
    );
    return normalizeUser(data);
}

export async function unfollowUser(publicId) {
    const { data } = await apiClient.delete(
        `/users/${encodeURIComponent(publicId)}/follow`,
    );
    return normalizeUser(data);
}

export async function blockUser(publicId, reason) {
    const { data } = await apiClient.patch(
        `/users/admin/${encodeURIComponent(publicId)}/block`,
        { reason },
    );
    return normalizeUser(data);
}

export async function unblockUser(publicId) {
    const { data } = await apiClient.patch(
        `/users/admin/${encodeURIComponent(publicId)}/unblock`,
    );
    return normalizeUser(data);
}

export async function getNotifications({ limit = 20, offset = 0 } = {}) {
    const { data } = await apiClient.get("/users/me/notifications", {
        params: getPaginationParams({ limit, offset }),
    });

    return data;
}

export async function getUnreadNotificationCount() {
    const { data } = await apiClient.get("/users/me/notifications/unread-count", {
        _silent: true,
    });
    return Number(data.count || 0);
}

export async function markAllNotificationsRead() {
    const { data } = await apiClient.patch("/users/me/notifications/read-all");
    return data;
}

export async function markNotificationRead(notificationId) {
    const { data } = await apiClient.patch(
        `/users/me/notifications/${notificationId}/read`,
    );

    return data;
}
