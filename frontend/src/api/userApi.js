import { apiClient } from "./apiClient";
import { getPaginationParams } from "./apiClient";


export function normalizeUser(user) {
    // Maps backend user fields to the camelCase names used by React components.
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
    // Loads the signed-in user's editable profile.
    const { data } = await apiClient.get("/users/me");
    return normalizeUser(data);
}

export async function updateUserProfile(payload) {
    // Updates the current user's username and profile description.
    const body = {
        username: payload.username,
        description: payload.description || null,
    };

    const { data } = await apiClient.patch("/users/me", body);
    return normalizeUser(data);
}

export async function uploadUserAvatar(file) {
    // Uploads a new avatar image for the signed-in user.
    const formData = new FormData();
    formData.append("avatar", file);

    const { data } = await apiClient.patch("/users/me/avatar", formData);
    return normalizeUser(data);
}

export async function deleteUserAvatar() {
    // Removes the current user's avatar and returns the refreshed profile.
    const { data } = await apiClient.delete("/users/me/avatar");
    return normalizeUser(data);
}

export async function getUsers({ limit = 12, offset = 0, search = "", role = "" } = {}) {
    // Loads a paginated, optionally filtered list of public users.
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
    // Finds one user using the public identifier visible in their profile.
    const { data } = await apiClient.get("/users/search", {
        params: { public_id: publicId },
    });

    return normalizeUser(data);
}

export async function getPublicUserProfile(publicId) {
    // Loads the profile that another visitor can view publicly.
    const { data } = await apiClient.get(`/users/${encodeURIComponent(publicId)}`);
    return normalizeUser(data);
}

export async function getFriends({ limit = 12, offset = 0, search = "" } = {}) {
    // Loads the current user's friends list with optional search and pagination.
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
    // Checks whether the current user follows a specific public profile.
    const { data } = await apiClient.get(
        `/users/${encodeURIComponent(publicId)}/following`,
        { _silent: true },
    );
    return Boolean(data?.is_following);
}

export async function getFriendshipStatus(publicId) {
    // Loads friendship and pending-request state for a public profile.
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
    // Starts following the selected public user.
    const { data } = await apiClient.post(
        `/users/${encodeURIComponent(publicId)}/follow`,
    );
    return normalizeUser(data);
}

export async function unfollowUser(publicId) {
    // Stops following the selected public user.
    const { data } = await apiClient.delete(
        `/users/${encodeURIComponent(publicId)}/follow`,
    );
    return normalizeUser(data);
}

export async function addFriend(publicId, message = "") {
    // Sends a friend request, optionally including a short message.
    const { data } = await apiClient.post(
        `/users/${encodeURIComponent(publicId)}/friend`,
        { message: message || undefined },
    );
    return normalizeUser(data);
}

export async function removeFriend(publicId) {
    // Removes an existing friendship with the selected user.
    const { data } = await apiClient.delete(
        `/users/${encodeURIComponent(publicId)}/friend`,
    );
    return normalizeUser(data);
}

export async function getFriendRequests() {
    // Loads incoming and outgoing friend requests in a UI-friendly format.
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
    // Returns the small unread friend-request counter shown in navigation.
    const { data } = await apiClient.get("/users/me/friend-requests/count", {
        _silent: true,
    });
    return Number(data?.count || 0);
}

export async function acceptFriendRequest(requestId) {
    // Accepts an incoming friend request.
    const { data } = await apiClient.post(
        `/users/me/friend-requests/${requestId}/accept`,
    );
    return data;
}

export async function declineFriendRequest(requestId) {
    // Declines an incoming friend request.
    const { data } = await apiClient.post(
        `/users/me/friend-requests/${requestId}/decline`,
    );
    return data;
}

export async function blockUser(publicId, reason) {
    // Lets an administrator block a user and store the block reason.
    const { data } = await apiClient.patch(
        `/users/admin/${encodeURIComponent(publicId)}/block`,
        { reason },
    );
    return normalizeUser(data);
}

export async function unblockUser(publicId) {
    // Lets an administrator restore a previously blocked user.
    const { data } = await apiClient.patch(
        `/users/admin/${encodeURIComponent(publicId)}/unblock`,
    );
    return normalizeUser(data);
}

export async function getNotifications({ limit = 20, offset = 0 } = {}) {
    // Loads the current user's notifications one page at a time.
    const { data } = await apiClient.get("/users/me/notifications", {
        params: getPaginationParams({ limit, offset }),
    });

    return data;
}

export async function getUnreadNotificationCount() {
    // Returns the notification count used for the navigation badge.
    const { data } = await apiClient.get("/users/me/notifications/unread-count", {
        _silent: true,
    });
    return Number(data.count || 0);
}

export async function markAllNotificationsRead() {
    // Marks every notification as read for the signed-in user.
    const { data } = await apiClient.patch("/users/me/notifications/read-all");
    return data;
}

export async function markNotificationRead(notificationId) {
    // Marks one notification as read after the user opens it.
    const { data } = await apiClient.patch(
        `/users/me/notifications/${notificationId}/read`,
    );

    return data;
}

export async function deleteAllNotifications() {
    // Deletes every notification belonging to the signed-in user.
    await apiClient.delete("/users/me/notifications");
}
