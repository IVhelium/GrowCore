export const CHAT_MESSAGE_MAX_LENGTH = 15000; // Maximum chat length accepted by the interface.

export function getChatMessageLength(value = "") {
  // Counts characters after converting an empty value to an empty string.
  return Array.from(String(value)).length;
}

export function isChatMessageTooLong(value = "") {
  // Checks whether a message exceeds the maximum allowed length.
  return getChatMessageLength(value.trim()) > CHAT_MESSAGE_MAX_LENGTH;
}

export function getChatMessageTooLongText() {
  // Returns the validation text shown when a message is too long.
  return `Message is too long. Maximum length is ${CHAT_MESSAGE_MAX_LENGTH.toLocaleString("en-US")} characters.`;
}
