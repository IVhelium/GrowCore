import { MessageCircle } from "lucide-react";
import EmptyState from "../common/EmptyState";
import UserAvatar from "../user/UserAvatar";
import ChatWindow from "./ChatWindow";

export default function ChatsPanel({
  chats,
  selectedChat,
  currentUser,
  messages,
  text,
  isAuthenticated,
  isLoading,
  isChatLoading,
  isSending,
  disabled = false,
  onSelectChat,
  onTextChange,
  onSendMessage,
}) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold text-slate-950">Chats</h2>
      {!isAuthenticated ? (
        <EmptyState title="Sign in to see chats" text="Your user chats appear here." />
      ) : isLoading ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
          Loading chats...
        </div>
      ) : chats.length === 0 ? (
        <EmptyState title="No chats yet" text="Open a user profile and start a chat." />
      ) : (
        <div className="mt-4 grid min-w-0 overflow-visible rounded-lg border border-slate-200 bg-white shadow-sm lg:h-720px lg:min-h-720px lg:max-h-720px lg:overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="min-w-0 overflow-hidden border-b border-slate-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-950">All chats</p>
            </div>
            <div className="max-h-52 min-w-0 max-w-full overflow-y-auto overflow-x-hidden lg:h-674px lg:max-h-none">
              {chats.map((chat) => (
                <button
                  key={chat.user.public_id}
                  type="button"
                  onClick={() => onSelectChat(chat.user)}
                  className={`flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                    selectedChat?.public_id === chat.user.public_id ? "bg-[#4F8A5B]/10" : ""
                  }`}
                >
                  <UserAvatar user={chat.user} size="md" />
                  <div className="min-w-0 max-w-[calc(100vw-7.5rem)] flex-1 overflow-hidden sm:max-w-[calc(100vw-9rem)] lg:max-w-[16rem]">
                    <h3 className="block max-w-full truncate text-sm font-bold text-slate-950">
                      {chat.user.username}
                    </h3>
                    <p className="mt-1 block max-w-full truncate text-xs text-slate-500">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0 bg-slate-50">
            {!selectedChat ? (
              <div className="grid min-h-96 place-items-center p-8 text-center lg:h-720px lg:min-h-720px lg:max-h-720px">
                <div>
                  <MessageCircle className="mx-auto text-[#4F8A5B]" size={34} />
                  <h3 className="mt-4 text-lg font-bold text-slate-950">
                    Select a chat
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Open a dialog from the side panel to continue messaging.
                  </p>
                </div>
              </div>
            ) : (
              <ChatWindow
                peer={selectedChat}
                currentUser={currentUser}
                messages={messages}
                value={text}
                onChange={onTextChange}
                onSubmit={onSendMessage}
                isLoading={isChatLoading}
                isSending={isSending}
                disabled={disabled}
                heightPx={720}
                heightClassName=""
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
