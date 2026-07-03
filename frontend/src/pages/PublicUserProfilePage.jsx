import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addFriend,
  blockUser,
  followUser,
  getFriendshipStatus,
  getFollowingStatus,
  getPublicUserProfile,
  removeFriend,
  unblockUser,
  unfollowUser,
} from "../api/userApi";
import {
  appendUniqueChatMessage,
  getChatMessages,
  normalizeChatMessage,
  sendChatMessage,
} from "../api/chatApi";
import { getPublicUserStore, getPublicUserStoreProducts } from "../api/storeApi";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import UserProfileCard from "../components/user/UserProfileCard";
import PublicProfileTabsPanel from "../components/user/PublicProfileTabsPanel";
import { useAuth } from "../hooks/useAuth";
import { useActionDialog } from "../hooks/useActionDialog";
import { getApiError } from "../utils/getApiError";
import { showToast } from "../utils/showToast";
import { getChatMessageTooLongText, isChatMessageTooLong } from "../utils/chatMessage";

function hasRole(user, role) {
  return (user?.roles || []).some((item) => item.role?.role === role || item.role === role);
}

export default function PublicUserProfilePage() {
  const { promptAction } = useActionDialog();
  const { publicId } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState(null);
  const [followCooldownUntil, setFollowCooldownUntil] = useState(0);
  const [isFollowCoolingDown, setIsFollowCoolingDown] = useState(false);
  const [store, setStore] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatSending, setIsChatSending] = useState(false);
  const messageCooldownRef = useRef(0);
  const { user: currentUser } = useAuth();
  const isAdmin = hasRole(currentUser, "admin");
  const isOwnProfile = currentUser?.public_id === user?.public_id;
  const isSellerProfile = hasRole(user, "seller");
  const canChat =
    !currentUser?.isBlocked &&
    !isOwnProfile &&
    currentUser?.public_id &&
    (isFriend || isSellerProfile);
  const [friendRequestMessage, setFriendRequestMessage] = useState("");

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
            setIsFriend(friendshipStatus.isFriend);
            setFriendRequestStatus(friendshipStatus);
          } catch {
            setIsFollowing(false);
            setIsFriend(false);
            setFriendRequestStatus(null);
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

  useEffect(() => {
    if (!currentUser?.public_id || !user?.public_id || isOwnProfile || currentUser?.isBlocked) {
      return undefined;
    }

    function handleIncomingMessage(event) {
      const incomingMessage = normalizeChatMessage(event.detail);
      const senderId = incomingMessage.sender?.public_id;
      const recipientId = incomingMessage.recipient?.public_id;
      const belongsToOpenChat =
        [senderId, recipientId].includes(user.public_id) &&
        [senderId, recipientId].includes(currentUser.public_id);

      if (!belongsToOpenChat) {
        return;
      }

      setChatMessages((currentMessages) => {
        return appendUniqueChatMessage(currentMessages, incomingMessage);
      });
    }
    window.addEventListener("growcore:chat-message-received", handleIncomingMessage);

    return () => {
      window.removeEventListener("growcore:chat-message-received", handleIncomingMessage);
    };
  }, [currentUser?.isBlocked, currentUser?.public_id, isOwnProfile, user?.public_id]);

  async function handleBlock() {
    const trimmedReason = await promptAction({
      title: `Block ${user.username}?`,
      description: "Add a reason that explains why this account is being blocked.",
      inputLabel: "Block reason",
      confirmLabel: "Block",
      tone: "danger",
      minLength: 10,
      minLengthMessage: "Block reason must be at least 10 characters.",
    });

    if (!trimmedReason) return;

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
        : await addFriend(user.public_id, friendRequestMessage);

      if (isFriend) {
        setIsFriend(false);
        setFriendRequestStatus(null);
        showToast("Friend removed", "success");
      } else if (friendRequestStatus?.requestDirection === "incoming") {
        setIsFriend(true);
        setFriendRequestStatus(null);
        showToast("Friend request accepted", "success");
        window.dispatchEvent(new Event("growcore:friend-requests-updated"));
      } else {
        setFriendRequestStatus({
          isFriend: false,
          requestStatus: "pending",
          requestDirection: "outgoing",
        });
        setFriendRequestMessage("");
        showToast("Friend request sent", "success");
        window.dispatchEvent(new Event("growcore:friend-requests-updated"));
      }
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

  async function handleSendMessage(event) {
    event.preventDefault();

    const message = chatText.trim();

    if (!message || !user) return;
    if (isChatMessageTooLong(message)) {
      showToast(getChatMessageTooLongText());
      return;
    }
    if (Date.now() < messageCooldownRef.current) return;

    if (currentUser?.isBlocked) {
      setErrorMessage("Your account is blocked. You can only contact support.");
      return;
    }

    setIsChatSending(true);
    messageCooldownRef.current = Date.now() + 1500;

    try {
      const createdMessage = await sendChatMessage(user.public_id, message);
      setChatMessages((currentMessages) =>
        appendUniqueChatMessage(currentMessages, createdMessage),
      );

      setChatText("");
    } catch (error) {
      if (error?.response?.status !== 429) {
        setErrorMessage(getApiError(error, "Could not send message"));
      }
    } finally {
      window.setTimeout(() => setIsChatSending(false), Math.max(0, messageCooldownRef.current - Date.now()));
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
    if (Date.now() < followCooldownUntil) {
      showToast("Please wait before changing follow status again.");
      return;
    }

    setIsActionBusy(true);

    try {
      const updatedUser = isFollowing
        ? await unfollowUser(user.public_id)
        : await followUser(user.public_id);

      setUser(updatedUser);
      setIsFollowing((value) => !value);
    } catch (error) {
      if (error?.response?.status === 429) {
        setFollowCooldownUntil(Date.now() + 10000);
        setIsFollowCoolingDown(true);
        showToast(getApiError(error, "Too many follow actions. Please try again shortly."));
        return;
      }
      setErrorMessage(getApiError(error, "Could not update follow status"));
    } finally {
      setIsActionBusy(false);
    }
  }

  useEffect(() => {
    if (!canChat || chatMessages.length > 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      loadChat();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canChat, user?.public_id]);

  useEffect(() => {
    if (!followCooldownUntil) {
      return undefined;
    }

    const delay = Math.max(0, followCooldownUntil - Date.now());
    const timer = window.setTimeout(() => {
      setIsFollowCoolingDown(false);
      setFollowCooldownUntil(0);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [followCooldownUntil]);

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
          <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:items-stretch">
            <div className="grid gap-4">
              <UserProfileCard user={user} className="min-h-640px">
                <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-2xl font-black text-slate-950">
                      {user?.followers_count ?? 0}
                    </div>
                    <div className="text-xs font-bold uppercase text-slate-400">Followers</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-2xl font-black text-slate-950">
                      {user?.following_count ?? 0}
                    </div>
                    <div className="text-xs font-bold uppercase text-slate-400">Following</div>
                  </div>
                </div>
                {currentUser?.public_id && !isOwnProfile && (
                  <div className="mt-5 grid gap-3">
                    {!isFriend && !friendRequestStatus?.requestDirection && (
                      <textarea
                        value={friendRequestMessage}
                        onChange={(event) => setFriendRequestMessage(event.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Write a short hello with your friend request"
                        className="break-anywhere min-h-20 resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none scrollbar-width:thin focus:border-[#4F8A5B]"
                      />
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      style={isFriend ? "secondary" : "primary"}
                      disabled={
                        isActionBusy ||
                        friendRequestStatus?.requestDirection === "outgoing"
                      }
                      onClick={handleFriendToggle}
                      className="w-full"
                    >
                      {isFriend
                        ? "Remove friend"
                        : friendRequestStatus?.requestDirection === "outgoing"
                          ? "Request sent"
                          : friendRequestStatus?.requestDirection === "incoming"
                            ? "Accept request"
                            : "Add friend"}
                    </Button>
                    <Button
                      type="button"
                      style={isFollowing ? "secondary" : "primary"}
                      disabled={isActionBusy || isFollowCoolingDown}
                      onClick={handleFollowToggle}
                      className="w-full"
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                    </div>
                  </div>
                )}
              </UserProfileCard>
            </div>
            <div className="grid min-w-0 gap-4">
              {user?.isBlocked && (
                <p className="break-anywhere rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
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
              <PublicProfileTabsPanel
                user={user}
                currentUser={currentUser}
                canChat={Boolean(canChat)}
                isOwnProfile={isOwnProfile}
                store={store}
                storeProducts={storeProducts}
                chatMessages={chatMessages}
                chatText={chatText}
                isChatLoading={isChatLoading}
                isChatSending={isChatSending}
                onChatTextChange={setChatText}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
