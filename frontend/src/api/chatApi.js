import { apiClient, getWebSocketUrl } from "./apiClient";
import { normalizeUser } from "./userApi";

export function normalizeChatMessage(message) {
  const createdAt = message.created_at || message.createdAt || null;
  const sender = normalizeUser(message.sender);
  const recipient = normalizeUser(message.recipient);
  const id = message.id ?? [
    sender?.public_id,
    recipient?.public_id,
    createdAt,
    message.message,
  ].filter(Boolean).join(":");

  return {
    id,
    clientKey: [
      id,
      sender?.public_id || "unknown-sender",
      recipient?.public_id || "unknown-recipient",
      createdAt || "unknown-time",
    ].join(":"),
    message: message.message,
    createdAt,
    sender,
    recipient,
  };
}

export function appendUniqueChatMessage(currentMessages, nextMessage) {
  if (
    currentMessages.some(
      (message) =>
        (message.id !== undefined &&
          nextMessage.id !== undefined &&
          String(message.id) === String(nextMessage.id)) ||
        (message.clientKey && message.clientKey === nextMessage.clientKey),
    )
  ) {
    return currentMessages;
  }

  return [...currentMessages, nextMessage];
}

export function normalizeChatMessages(messages) {
  return (messages || [])
    .map(normalizeChatMessage)
    .reduce(
      (uniqueMessages, message) =>
        appendUniqueChatMessage(uniqueMessages, message),
      [],
    );
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
  return normalizeChatMessages(data);
}

export async function sendChatMessage(publicId, message) {
  const { data } = await apiClient.post(
    `/users/${encodeURIComponent(publicId)}/chat`,
    { message },
    { _silent: true },
  );
  return normalizeChatMessage(data);
}

export async function createChatSocket() {
  const { data } = await apiClient.post("/users/ws-ticket", null, { _silent: true });
  const socketUrl = new URL(getWebSocketUrl("/users/ws/chats"));
  socketUrl.searchParams.set("ticket", data.ticket);
  return new WebSocket(socketUrl.toString());
}
