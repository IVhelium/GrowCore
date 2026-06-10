import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { blockUser, getPublicUserProfile, unblockUser } from "../api/userApi";
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
  }, [publicId]);

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
          <div className="grid max-w-md gap-4">
            <UserProfileCard user={user} />
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
          </div>
        )}
      </Container>
    </main>
  );
}
