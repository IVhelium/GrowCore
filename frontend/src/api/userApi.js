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

export async function getUsers({ limit = 12, offset = 0, search = "", role = "" } = {}) {
    const { data } = await apiClient.get("/users", {
        params: {
            ...getPaginationParams({ limit, offset }),
            ...(search ? { search } : {}),
            ...(role ? { role } : {}),
        },
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

export async function getFriends({ limit = 12, offset = 0, search = "" } = {}) {
    const { data } = await apiClient.get("/users/me/friends", {
        params: {
            ...getPaginationParams({ limit, offset }),
            ...(search ? { search } : {}),
        },
    });

    return {
        ...data,
        items: (data.items || []).map(normalizeUser),
    };
}

export async function getFollowingStatus(publicId) {
    const { data } = await apiClient.get(
        `/users/${encodeURIComponent(publicId)}/following`,
        { _silent: true },
    );
    return Boolean(data?.is_following);
}

export async function getFriendshipStatus(publicId) {
    const { data } = await apiClient.get(
        `/users/${encodeURIComponent(publicId)}/friendship`,
        { _silent: true },
    );
    return {
        isFriend: Boolean(data?.is_friend),
        requestStatus: data?.request_status || null,
        requestDirection: data?.request_direction || null,
        requestId: data?.request_id || null,
    };
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

export async function addFriend(publicId, message = "") {
    const { data } = await apiClient.post(
        `/users/${encodeURIComponent(publicId)}/friend`,
        { message: message || undefined },
    );
    return normalizeUser(data);
}

export async function removeFriend(publicId) {
    const { data } = await apiClient.delete(
        `/users/${encodeURIComponent(publicId)}/friend`,
    );
    return normalizeUser(data);
}

export async function getFriendRequests() {
    const { data } = await apiClient.get("/users/me/friend-requests");
    return (data || []).map((request) => ({
        id: request.id,
        status: request.status,
        message: request.message || "",
        createdAt: request.created_at,
        requester: normalizeUser(request.requester),
        recipient: normalizeUser(request.recipient),
    }));
}

export async function getFriendRequestCount() {
    const { data } = await apiClient.get("/users/me/friend-requests/count", {
        _silent: true,
    });
    return Number(data?.count || 0);
}

export async function acceptFriendRequest(requestId) {
    const { data } = await apiClient.post(
        `/users/me/friend-requests/${requestId}/accept`,
    );
    return data;
}

export async function declineFriendRequest(requestId) {
    const { data } = await apiClient.post(
        `/users/me/friend-requests/${requestId}/decline`,
    );
    return data;
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

export async function deleteAllNotifications() {
    await apiClient.delete("/users/me/notifications");
}
