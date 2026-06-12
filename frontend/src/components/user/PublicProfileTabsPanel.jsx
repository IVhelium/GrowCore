import { useMemo, useState } from "react";
import ChatWindow from "../chat/ChatWindow";
import PublicProfileStorePanel from "./PublicProfileStorePanel";

export default function PublicProfileTabsPanel({
  user,
  currentUser,
  canChat,
  isOwnProfile,
  store,
  storeProducts,
  chatMessages,
  chatText,
  isChatLoading,
  isChatSending,
  onChatTextChange,
  onSendMessage,
}) {
  const tabs = useMemo(
    () => [
      ...(canChat && !isOwnProfile && currentUser?.public_id
        ? [{ id: "chat", label: "Chat" }]
        : []),
      ...(store ? [{ id: "store", label: "Store" }] : []),
    ],
    [canChat, currentUser?.public_id, isOwnProfile, store],
  );
  const [requestedTab, setRequestedTab] = useState(tabs[0]?.id || "store");
  const activeTab = tabs.some((tab) => tab.id === requestedTab)
    ? requestedTab
    : tabs[0]?.id;

  if (tabs.length === 0) {
    return null;
  }

  return (
    <aside className="flex h-full min-h-[640px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 bg-white p-3">
        <div className="grid rounded-lg border border-slate-200 bg-slate-50 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRequestedTab(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-white text-[#4F8A5B] shadow-sm"
                  : "text-slate-500 hover:text-slate-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1">
        {activeTab === "chat" ? (
          <ChatWindow
            peer={user}
            currentUser={currentUser}
            messages={chatMessages}
            value={chatText}
            onChange={onChatTextChange}
            onSubmit={onSendMessage}
            isLoading={isChatLoading}
            isSending={isChatSending}
            heightPx={588}
            heightClassName=""
          />
        ) : (
          <PublicProfileStorePanel
            store={store}
            products={storeProducts}
            user={user}
            embedded
          />
        )}
      </div>
    </aside>
  );
}
