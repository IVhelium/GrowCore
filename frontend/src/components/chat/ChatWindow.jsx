import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import UserAvatar from "../user/UserAvatar";
import {
  CHAT_MESSAGE_MAX_LENGTH,
  getChatMessageLength,
  getChatMessageTooLongText,
  isChatMessageTooLong,
} from "../../utils/chatMessage";
import { showToast } from "../../utils/showToast";

function formatMessageTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMessageText(value) {
  const parts = String(value || "").split(/(\s+)/);

  return parts.flatMap((part, partIndex) => {
    if (!part || /\s+/.test(part)) {
      return part;
    }

    const chunks = part.match(/.{1,18}/gu) || [part];

    return chunks.flatMap((chunk, chunkIndex) => [
      <span key={`${partIndex}-${chunkIndex}`}>{chunk}</span>,
      chunkIndex < chunks.length - 1
        ? <wbr key={`${partIndex}-${chunkIndex}-break`} />
        : null,
    ]);
  });
}

export default function ChatWindow({
  peer,
  currentUser,
  messages = [],
  value,
  onChange,
  onSubmit,
  isLoading = false,
  isSending = false,
  disabled = false,
  heightPx,
  heightClassName = "h-[720px]",
}) {
  const messagesPaneRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const pane = messagesPaneRef.current;

    if (pane) {
      pane.scrollTop = pane.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    const maxHeight = 96;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value]);

  function handleSubmit(event) {
    if (isChatMessageTooLong(value)) {
      event.preventDefault();
      showToast(getChatMessageTooLongText());
      textareaRef.current?.focus();
      return;
    }

    onSubmit(event);
    window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }

  function handleKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!isSending && value.trim()) {
      if (isChatMessageTooLong(value)) {
        showToast(getChatMessageTooLongText());
        return;
      }

      event.currentTarget.form?.requestSubmit();
    }
  }

  const messageLength = getChatMessageLength(value);
  const isOverLimit = messageLength > CHAT_MESSAGE_MAX_LENGTH;

  return (
    <div
      className={`flex min-h-0 w-full max-w-full flex-col overflow-hidden bg-slate-50 ${heightClassName}`}
      style={
        heightPx
          ? { height: `${heightPx}px`, minHeight: `${heightPx}px`, maxHeight: `${heightPx}px` }
          : undefined
      }
    >
      {peer && (
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <UserAvatar user={peer} size="md" />
          <div className="min-w-0">
            <h3 className="truncate font-bold text-slate-950">{peer.username}</h3>
            <p className="truncate text-xs text-slate-500">{peer.public_id}</p>
          </div>
        </div>
      )}

      <div
        ref={messagesPaneRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-5"
      >
        {isLoading ? (
          <div className="rounded-lg bg-white p-4 text-sm text-slate-500">
            Loading chat...
          </div>
        ) : messages.length === 0 ? (
          <EmptyState title="No messages yet" text="Start the conversation." />
        ) : (
          <div className="grid min-w-0 gap-3">
            {messages.map((message, index) => {
              const isMine = message.sender?.public_id === currentUser?.public_id;
              const messageKeyBase = message.clientKey || [
                message.id,
                message.sender?.public_id,
                message.recipient?.public_id,
                message.createdAt,
              ].filter(Boolean).join(":");
              const messageKey = `${messageKeyBase || "message"}:${index}`;

              return (
                <div
                  key={messageKey}
                  className={`w-full min-w-0 max-w-full overflow-hidden ${
                    isMine ? "flex justify-end" : "grid grid-cols-[auto_minmax(0,1fr)] gap-3"
                  }`}
                >
                  {!isMine && <UserAvatar user={message.sender} size="sm" />}
                  <div
                    className={`chat-message-bubble rounded-lg px-4 py-3 text-sm shadow-sm ${isMine ? "" : "justify-self-start"} ${
                      isMine ? "bg-[#4F8A5B] text-white" : "bg-white text-slate-700"
                    }`}
                  >
                    <p
                      className="chat-message-text leading-5"
                    >
                      {renderMessageText(message.message)}
                    </p>
                    <p className={`mt-1 text-[11px] ${isMine ? "text-white/75" : "text-slate-400"}`}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!disabled && (
        <form onSubmit={handleSubmit} className="grid h-32 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-slate-200 bg-white p-3 md:gap-3 md:p-4">
          <div className="min-w-0 self-center">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message"
              rows={1}
              aria-invalid={isOverLimit}
              aria-describedby="chat-message-length"
              className={`max-h-24 min-h-11 w-full min-w-0 resize-none overflow-x-hidden whitespace-pre-wrap break-anywhere rounded-lg border px-4 py-3 text-sm leading-5 outline-none scrollbar-width:thin ${
                isOverLimit
                  ? "border-red-400 focus:border-red-500"
                  : "border-slate-200 focus:border-[#4F8A5B]"
              }`}
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            />
            <p
              id="chat-message-length"
              className={`mt-1 text-right text-xs ${isOverLimit ? "font-semibold text-red-600" : "text-slate-400"}`}
            >
              {messageLength.toLocaleString("en-US")} / {CHAT_MESSAGE_MAX_LENGTH.toLocaleString("en-US")}
            </p>
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={isSending || !value.trim()}
            className="h-11 w-11 shrink-0 self-center p-0 md:w-auto md:px-4"
            aria-label="Send message"
          >
            <Send size={17} />
            <span className="hidden md:inline">Send</span>
          </Button>
        </form>
      )}
    </div>
  );
}
