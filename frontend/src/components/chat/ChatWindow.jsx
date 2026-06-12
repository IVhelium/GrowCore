import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import UserAvatar from "../user/UserAvatar";

function formatMessageTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
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
      event.currentTarget.form?.requestSubmit();
    }
  }

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
            {messages.map((message) => {
              const isMine = message.sender.public_id === currentUser?.public_id;

              return (
                <div
                  key={message.id}
                  className={`min-w-0 overflow-hidden ${isMine ? "flex justify-end" : "grid grid-cols-[auto_minmax(0,1fr)] gap-3"}`}
                >
                  {!isMine && <UserAvatar user={message.sender} size="sm" />}
                  <div
                    className={`min-w-0 max-w-[80%] overflow-hidden rounded-lg px-4 py-3 text-sm shadow-sm ${
                      isMine ? "bg-[#4F8A5B] text-white" : "bg-white text-slate-700"
                    }`}
                  >
                    <p
                      className="min-w-0 max-w-full whitespace-pre-wrap wrap-break-words leading-5"
                      style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                    >
                      {message.message}
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
        <form onSubmit={handleSubmit} className="flex h-32 shrink-0 items-center gap-3 border-t border-slate-200 bg-white p-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message"
            rows={1}
            className="max-h-24 min-h-11 min-w-0 flex-1 resize-none self-center whitespace-pre-wrap rounded-lg border border-slate-200 px-4 py-3 text-sm leading-5 outline-none scrollbar-width:thin focus:border-[#4F8A5B]"
          />
          <Button type="submit" disabled={isSending || !value.trim()} className="self-center">
            <Send size={17} />
            Send
          </Button>
        </form>
      )}
    </div>
  );
}
