import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  blockUser,
  followUser,
  getFollowingStatus,
  getPublicUserProfile,
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
  const [store, setStore] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const { user: currentUser } = useAuth();
  const isAdmin = hasRole(currentUser, "admin");

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
            setIsFollowing(await getFollowingStatus(loadedUser.public_id));
          } catch {
            setIsFollowing(false);
          }
        }

        if (isActive && hasRole(loadedUser, "seller")) {
          try {
            const [loadedStore, productPage] = await Promise.all([
              getPublicUserStore(loadedUser.public_id),
              getPublicUserStoreProducts(loadedUser.public_id, { limit: 4 }),
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
                {currentUser?.public_id && currentUser.public_id !== user?.public_id && (
                  <Button
                    type="button"
                    style={isFollowing ? "secondary" : "primary"}
                    disabled={isActionBusy}
                    onClick={handleFollowToggle}
                    className="mt-4 w-full"
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}
              </div>
            </div>
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
              <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">{store.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {store.description || "Seller store"}
                </p>
                <div className="mt-5 grid gap-3">
                  {storeProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:border-[#4F8A5B]"
                    >
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-14 w-14 rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {product.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.category || "Product"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </aside>
            )}
          </div>
        )}
      </Container>
    </main>
  );
}
