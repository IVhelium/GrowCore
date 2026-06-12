import { apiClient, getWebSocketUrl } from "./apiClient";
import { normalizeUser } from "./userApi";

export function normalizeChatMessage(message) {
  return {
    id: message.id,
    message: message.message,
    createdAt: message.created_at,
    sender: normalizeUser(message.sender),
    recipient: normalizeUser(message.recipient),
  };
}

export function normalizeChatThread(thread) {
  return {
    user: normalizeUser(thread.user),
    lastMessage: thread.last_message || "",
    lastMessageAt: thread.last_message_at || null,
  };
}

export async function getChatThreads() {
  const { data } = await apiClient.get("/users/me/chats");
  return (data || []).map(normalizeChatThread);
}

export async function getChatMessages(publicId) {
  const { data } = await apiClient.get(`/users/${encodeURIComponent(publicId)}/chat`);
  return (data || []).map(normalizeChatMessage);
}

export async function sendChatMessage(publicId, message) {
  const { data } = await apiClient.post(
    `/users/${encodeURIComponent(publicId)}/chat`,
    { message },
  );
  return normalizeChatMessage(data);
}

export function createChatSocket() {
  return new WebSocket(getWebSocketUrl("/users/ws/chats"));
}
