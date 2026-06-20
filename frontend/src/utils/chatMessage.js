export const CHAT_MESSAGE_MAX_LENGTH = 15000;

export function getChatMessageLength(value = "") {
  return Array.from(String(value)).length;
}

export function isChatMessageTooLong(value = "") {
  return getChatMessageLength(value.trim()) > CHAT_MESSAGE_MAX_LENGTH;
}

export function getChatMessageTooLongText() {
  return `Message is too long. Maximum length is ${CHAT_MESSAGE_MAX_LENGTH.toLocaleString("en-US")} characters.`;
}
