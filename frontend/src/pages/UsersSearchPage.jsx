import { useEffect, useState } from "react";
import { MessageCircle, UserRoundCheck, Users } from "lucide-react";
import {
  appendUniqueChatMessage,
  createChatSocket,
  getChatMessages,
  getChatThreads,
  normalizeChatMessage,
  sendChatMessage,
} from "../api/chatApi";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequestCount,
  getFriendRequests,
  getFriends,
  getUsers,
  searchUserByPublicId,
} from "../api/userApi";
import { useAutoDismissMessage } from "../hooks/useAutoDismissMessage";
import { useAuth } from "../hooks/useAuth";
import { getApiError } from "./../utils/getApiError";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import ChatsPanel from "../components/chat/ChatsPanel";
import FriendsPanel from "../components/user/FriendsPanel";
import UserResultCard from "../components/user/UserResultCard";
import UsersGridSection from "../components/user/UsersGridSection";
import UsersSearchBox from "../components/user/UsersSearchBox";
import UsersTabs from "../components/user/UsersTabs";
import { showToast } from "../utils/showToast";
import { randomUsers } from "../utils/randomArray";

const PAGE_SIZE = 39;
const FRIENDS_PAGE_SIZE = 18;

export default function UsersSearchPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [appliedUserSearch, setAppliedUserSearch] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const [appliedFriendSearch, setAppliedFriendSearch] = useState("");
  const [result, setResult] = useState(null);
  const [total, setTotal] = useState(0);
  const [friendsTotal, setFriendsTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [friendsPage, setFriendsPage] = useState(1);
  const [error, setError] = useAutoDismissMessage("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isChatsLoading, setIsChatsLoading] = useState(false);
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatSending, setIsChatSending] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadUsers() {
      setIsLoading(true);

      try {
        const page = await getUsers({
          limit: PAGE_SIZE,
          offset: (currentPage - 1) * PAGE_SIZE,
          search: appliedUserSearch,
        });

        if (isActive) {
          setUsers(randomUsers(page.items || []));
          setTotal(page.total || 0);
        }
      } catch (requestError) {
        if (isActive) {
          setError(getApiError(requestError, "Could not load users"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isActive = false;
    };
  }, [appliedUserSearch, currentPage, setError]);

  useEffect(() => {
    let isActive = true;

    async function loadChats() {
      if (activeTab !== "chats" || !isAuthenticated) return;

      setIsChatsLoading(true);

      try {
        const loadedChats = await getChatThreads();

        if (isActive) {
          setChats(loadedChats);
        }
      } catch (requestError) {
        if (isActive) {
          setError(getApiError(requestError, "Could not load chats"));
        }
      } finally {
        if (isActive) {
          setIsChatsLoading(false);
        }
      }
    }

    loadChats();

    return () => {
      isActive = false;
    };
  }, [activeTab, isAuthenticated, setError]);

  useEffect(() => {
    let isActive = true;

    async function loadFriends() {
      if (activeTab !== "friends" || !isAuthenticated) return;

      setIsFriendsLoading(true);

      try {
        const page = await getFriends({
          limit: FRIENDS_PAGE_SIZE,
          offset: (friendsPage - 1) * FRIENDS_PAGE_SIZE,
          search: appliedFriendSearch,
        });

        if (isActive) {
          setFriends(page.items || []);
          setFriendsTotal(page.total || 0);
        }
      } catch (requestError) {
        if (isActive) {
          setError(getApiError(requestError, "Could not load friends"));
        }
      } finally {
        if (isActive) {
          setIsFriendsLoading(false);
        }
      }
    }

    loadFriends();

    return () => {
      isActive = false;
    };
  }, [activeTab, appliedFriendSearch, friendsPage, isAuthenticated, setError]);

  useEffect(() => {
    let isActive = true;

    async function loadFriendRequests() {
      if (!isAuthenticated) {
        setFriendRequestCount(0);
        setFriendRequests([]);
        return;
      }

      try {
        const [requests, count] = await Promise.all([
          activeTab === "friends" ? getFriendRequests() : Promise.resolve([]),
          getFriendRequestCount(),
        ]);

        if (isActive) {
          setFriendRequestCount(count);
          if (activeTab === "friends") {
            setFriendRequests(requests);
          }
        }
      } catch {
        if (isActive) {
          setFriendRequestCount(0);
        }
      }
    }

    loadFriendRequests();
    window.addEventListener(
      "growcore:friend-requests-updated",
      loadFriendRequests,
    );
    window.addEventListener("focus", loadFriendRequests);

    return () => {
      isActive = false;
      window.removeEventListener(
        "growcore:friend-requests-updated",
        loadFriendRequests,
      );
      window.removeEventListener("focus", loadFriendRequests);
    };
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    let isActive = true;

    async function loadSelectedChat() {
      if (activeTab !== "chats" || !selectedChat?.public_id) return;

      setIsChatLoading(true);

      try {
        const messages = await getChatMessages(selectedChat.public_id);

        if (isActive) {
          setChatMessages(messages);
        }
      } catch (requestError) {
        if (isActive) {
          setError(getApiError(requestError, "Could not load chat"));
        }
      } finally {
        if (isActive) {
          setIsChatLoading(false);
        }
      }
    }

    loadSelectedChat();

    return () => {
      isActive = false;
    };
  }, [activeTab, selectedChat?.public_id, setError]);

  useEffect(() => {
    if (activeTab !== "chats" || !isAuthenticated || !currentUser?.public_id) {
      return undefined;
    }

    const socket = createChatSocket();

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type !== "message") {
        return;
      }

      const incomingMessage = normalizeChatMessage(payload.message);
      const peer =
        incomingMessage.sender.public_id === currentUser?.public_id
          ? incomingMessage.recipient
          : incomingMessage.sender;

      setChats((currentChats) => {
        const existingChat = currentChats.find(
          (chat) =>
            chat.user.public_id === incomingMessage.sender.public_id ||
            chat.user.public_id === incomingMessage.recipient.public_id,
        );
        const chatUser = existingChat?.user || peer;
        const updatedChat = {
          user: chatUser,
          lastMessage: incomingMessage.message,
          lastMessageAt: incomingMessage.createdAt,
        };

        return [
          updatedChat,
          ...currentChats.filter(
            (chat) => chat.user.public_id !== chatUser.public_id,
          ),
        ];
      });

      setChatMessages((currentMessages) => {
        if (!selectedChat) return currentMessages;

        const belongsToSelectedChat =
          incomingMessage.sender.public_id === selectedChat.public_id ||
          incomingMessage.recipient.public_id === selectedChat.public_id;

        if (!belongsToSelectedChat) return currentMessages;
        return appendUniqueChatMessage(currentMessages, incomingMessage);
      });
    };

    return () => {
      socket.close();
    };
  }, [activeTab, currentUser?.public_id, isAuthenticated, selectedChat]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setCurrentPage(1);

    const search = new FormData(event.currentTarget).get("search").trim();

    setAppliedUserSearch(search);

    if (!search.startsWith("#")) {
      return;
    }

    setIsSearchLoading(true);

    try {
      const user = await searchUserByPublicId(search.toUpperCase());
      setResult(user);
    } catch (requestError) {
      setError(getApiError(requestError, "User not found"));
    } finally {
      setIsSearchLoading(false);
    }
  }

  function handleFriendSearchSubmit(event) {
    event.preventDefault();
    setFriendsPage(1);
    setAppliedFriendSearch(friendSearch.trim());
  }

  function handleSelectChat(chatUser) {
    setSelectedChat(chatUser);
    setChatMessages([]);
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const message = chatText.trim();
    if (!message || !selectedChat) return;

    if (currentUser?.isBlocked) {
      setError("Your account is blocked. You can only contact support.");
      return;
    }

    setIsChatSending(true);
    setError("");

    try {
      const createdMessage = await sendChatMessage(
        selectedChat.public_id,
        message,
      );

      setChatMessages((currentMessages) =>
        appendUniqueChatMessage(currentMessages, createdMessage),
      );
      setChats((currentChats) => {
        const updatedChat = {
          user: selectedChat,
          lastMessage: createdMessage.message,
          lastMessageAt: createdMessage.createdAt,
        };

        return [
          updatedChat,
          ...currentChats.filter(
            (chat) => chat.user.public_id !== selectedChat.public_id,
          ),
        ];
      });
      setChatText("");
    } catch (requestError) {
      setError(getApiError(requestError, "Could not send message"));
    } finally {
      setIsChatSending(false);
    }
  }

  async function handleFriendRequestAction(requestId, action) {
    try {
      if (action === "accept") {
        await acceptFriendRequest(requestId);
        showToast("Friend request accepted", "success");
      } else {
        await declineFriendRequest(requestId);
        showToast("Friend request declined", "success");
      }

      setFriendRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== requestId),
      );
      setFriendRequestCount((count) => Math.max(0, count - 1));
      window.dispatchEvent(new Event("growcore:friend-requests-updated"));
    } catch (requestError) {
      setError(getApiError(requestError, "Could not update friend request"));
    }
  }

  const tabs = [
    { id: "users", label: "Users", icon: Users },
    { id: "chats", label: "Chats", icon: MessageCircle },
    {
      id: "friends",
      label: "Friends",
      icon: UserRoundCheck,
      count: friendRequestCount,
    },
  ];

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Users"
          title="Find a GrowCore user"
          text="Browse all members or search by username or public ID, for example #A1B2C3D4E5"
        />

        <UsersSearchBox
          value={userSearch}
          onChange={setUserSearch}
          onSubmit={handleSubmit}
          isLoading={isSearchLoading}
        />

        {error && (
          <p className="mt-6 max-w-xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-6 max-w-xl">
            <UserResultCard user={result} />
          </div>
        )}

        <UsersTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "users" ? (
          <UsersGridSection
            users={users}
            isLoading={isLoading}
            currentPage={currentPage}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        ) : activeTab === "chats" ? (
          <ChatsPanel
            chats={chats}
            selectedChat={selectedChat}
            currentUser={currentUser}
            messages={chatMessages}
            text={chatText}
            isAuthenticated={isAuthenticated}
            isLoading={isChatsLoading}
            isChatLoading={isChatLoading}
            isSending={isChatSending}
            disabled={currentUser?.isBlocked}
            onSelectChat={handleSelectChat}
            onTextChange={setChatText}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <FriendsPanel
            isAuthenticated={isAuthenticated}
            friendRequests={friendRequests}
            friends={friends}
            search={friendSearch}
            isLoading={isFriendsLoading}
            currentPage={friendsPage}
            total={friendsTotal}
            pageSize={FRIENDS_PAGE_SIZE}
            onSearchChange={setFriendSearch}
            onSearchSubmit={handleFriendSearchSubmit}
            onPageChange={setFriendsPage}
            onRequestAction={handleFriendRequestAction}
          />
        )}
      </Container>
    </main>
  );
}
