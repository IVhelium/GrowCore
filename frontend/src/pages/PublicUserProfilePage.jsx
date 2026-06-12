import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addFriend,
  blockUser,
  followUser,
  getChatMessages,
  getFriendshipStatus,
  getFollowingStatus,
  getPublicUserProfile,
  removeFriend,
  sendChatMessage,
  unblockUser,
  unfollowUser,
} from "../api/userApi";
import { getPublicUserStore, getPublicUserStoreProducts } from "../api/storeApi";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import UserProfileCard from "../components/user/UserProfileCard";
import { useAuth } from "../hooks/useAuth";
import { getApiError } from "../utils/getApiError";
import { showToast } from "../utils/showToast";

function hasRole(user, role) {
  return (user?.roles || []).some((item) => item.role?.role === role || item.role === role);
}

export default function PublicUserProfilePage() {
  const { publicId } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [store, setStore] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeTab, setStoreTab] = useState("products");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatSending, setIsChatSending] = useState(false);
  const { user: currentUser } = useAuth();
  const isAdmin = hasRole(currentUser, "admin");
  const isOwnProfile = currentUser?.public_id === user?.public_id;

  useEffect(() => {
    let isActive = true;

    async function loadUser() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const loadedUser = await getPublicUserProfile(publicId);

        if (isActive) {
          setUser(loadedUser);
        }

        if (isActive && currentUser?.public_id && currentUser.public_id !== loadedUser.public_id) {
          try {
            const [followingStatus, friendshipStatus] = await Promise.all([
              getFollowingStatus(loadedUser.public_id),
              getFriendshipStatus(loadedUser.public_id),
            ]);
            setIsFollowing(followingStatus);
            setIsFriend(friendshipStatus);
          } catch {
            setIsFollowing(false);
            setIsFriend(false);
          }
        }

        if (isActive && hasRole(loadedUser, "seller")) {
          try {
            const [loadedStore, productPage] = await Promise.all([
              getPublicUserStore(loadedUser.public_id),
              getPublicUserStoreProducts(loadedUser.public_id, { limit: 24 }),
            ]);
            setStore(loadedStore);
            setStoreProducts(productPage.items || []);
          } catch {
            setStore(null);
            setStoreProducts([]);
          }
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getApiError(error, "User not found"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isActive = false;
    };
  }, [currentUser?.public_id, publicId]);

  async function handleBlock() {
    const reason = window.prompt(`Reason for blocking ${user.username}`);
    const trimmedReason = reason?.trim();

    if (!trimmedReason) return;

    if (trimmedReason.length < 10) {
      showToast("Block reason must be at least 10 characters");
      return;
    }

    setIsActionBusy(true);
    setErrorMessage("");

    try {
      const updatedUser = await blockUser(user.public_id, trimmedReason);
      setUser(updatedUser);
      showToast("User blocked and notified", "success");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not block user"));
    } finally {
      setIsActionBusy(false);
    }
  }

  async function handleFriendToggle() {
    if (!user) return;

    setIsActionBusy(true);

    try {
      isFriend
        ? await removeFriend(user.public_id)
        : await addFriend(user.public_id);

      setIsFriend((value) => !value);
      showToast(isFriend ? "Friend removed" : "Friend added", "success");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not update friend status"));
    } finally {
      setIsActionBusy(false);
    }
  }

  async function loadChat() {
    if (!user || isOwnProfile) return;

    setIsChatLoading(true);

    try {
      setChatMessages(await getChatMessages(user.public_id));
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not load chat"));
    } finally {
      setIsChatLoading(false);
    }
  }

  async function handleStoreTabChange(tab) {
    setStoreTab(tab);

    if (tab === "chat" && chatMessages.length === 0) {
      await loadChat();
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const message = chatText.trim();

    if (!message || !user) return;

    setIsChatSending(true);

    try {
      const createdMessage = await sendChatMessage(user.public_id, message);
      setChatMessages((currentMessages) => [...currentMessages, createdMessage]);
      setChatText("");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not send message"));
    } finally {
      setIsChatSending(false);
    }
  }

  async function handleUnblock() {
    setIsActionBusy(true);
    setErrorMessage("");

    try {
      const updatedUser = await unblockUser(user.public_id);
      setUser(updatedUser);
      showToast("User unblocked", "success");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not unblock user"));
    } finally {
      setIsActionBusy(false);
    }
  }

  async function handleFollowToggle() {
    if (!user) return;

    setIsActionBusy(true);

    try {
      const updatedUser = isFollowing
        ? await unfollowUser(user.public_id)
        : await followUser(user.public_id);

      setUser(updatedUser);
      setIsFollowing((value) => !value);
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not update follow status"));
    } finally {
      setIsActionBusy(false);
    }
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="User profile"
          title={user?.username || "GrowCore user"}
          text={user?.description || "Public GrowCore profile"}
        />

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Loading profile...
          </div>
        ) : errorMessage ? (
          <EmptyState title="User not found" text={errorMessage} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:items-start">
            <div className="grid gap-4">
              <UserProfileCard user={user} />
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-2xl font-black text-slate-950">
                      {user?.followers_count ?? 0}
                    </div>
                    <div className="text-xs font-bold uppercase text-slate-400">
                      Followers
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-2xl font-black text-slate-950">
                      {user?.following_count ?? 0}
                    </div>
                    <div className="text-xs font-bold uppercase text-slate-400">
                      Following
                    </div>
                  </div>
                </div>
              </div>
              {currentUser?.public_id && !isOwnProfile && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    style={isFriend ? "secondary" : "primary"}
                    disabled={isActionBusy}
                    onClick={handleFriendToggle}
                    className="w-full"
                  >
                    {isFriend ? "Remove friend" : "Add friend"}
                  </Button>
                  <Button
                    type="button"
                    style={isFollowing ? "secondary" : "primary"}
                    disabled={isActionBusy}
                    onClick={handleFollowToggle}
                    className="w-full"
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                </div>
                )}
            </div>
            <div className="grid min-w-0 gap-4">
              {user?.isBlocked && (
                <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  Blocked: {user.blockReason || "No reason provided"}
                </p>
              )}
              {isAdmin && currentUser?.public_id !== user?.public_id && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-slate-950">Admin actions</h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {user?.isBlocked ? (
                      <Button
                        type="button"
                        style="secondary"
                        disabled={isActionBusy}
                        onClick={handleUnblock}
                      >
                        Unblock user
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        style="danger"
                        disabled={isActionBusy}
                        onClick={handleBlock}
                      >
                        Block user
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {store && (
                <aside className="flex h-[640px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-10rem)]">
                  <div className="shrink-0 border-b border-slate-100 bg-white p-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <img
                        src={storeProducts[0]?.image || user.avatarUrl || "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=700&auto=format&fit=crop"}
                        alt={store.name}
                        className="h-16 w-16 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold text-slate-950">
                          {store.name}
                        </h2>
                        <p className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-slate-500">
                          {store.description || "Seller store"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                      {["products", "chat"].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => handleStoreTabChange(tab)}
                          className={`rounded-md px-4 py-2 text-sm font-bold capitalize transition ${
                            storeTab === tab
                              ? "bg-white text-[#4F8A5B] shadow-sm"
                              : "text-slate-500 hover:text-slate-950"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {storeTab === "products" ? (
                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {storeProducts.map((product) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:border-[#4F8A5B]"
                          >
                            <img
                              src={product.image}
                              alt={product.title}
                              className="h-14 w-14 shrink-0 rounded-md object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-950">
                                {product.title}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {product.category || "Product"}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="min-h-0 flex-1 overflow-y-auto p-5">
                        {isOwnProfile ? (
                          <EmptyState title="Store chat" text="Open chats from the users page." />
                        ) : isChatLoading ? (
                          <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
                            Loading chat...
                          </div>
                        ) : chatMessages.length === 0 ? (
                          <EmptyState title="No messages yet" text="Start the conversation." />
                        ) : (
                          <div className="grid gap-3">
                            {chatMessages.map((message) => {
                              const isMine = message.sender.public_id === currentUser?.public_id;

                              return (
                                <div
                                  key={message.id}
                                  className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                                    isMine
                                      ? "ml-auto bg-[#4F8A5B] text-white"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {message.message}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {!isOwnProfile && currentUser?.public_id && (
                        <form
                          onSubmit={handleSendMessage}
                          className="flex gap-3 border-t border-slate-100 p-4"
                        >
                          <input
                            value={chatText}
                            onChange={(event) => setChatText(event.target.value)}
                            placeholder="Message"
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4F8A5B]"
                          />
                          <Button type="submit" disabled={isChatSending || !chatText.trim()}>
                            Send
                          </Button>
                        </form>
                      )}
                    </div>
                  )}
                </aside>
              )}
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
