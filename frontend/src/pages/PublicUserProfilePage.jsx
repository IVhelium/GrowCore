import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicUserProfile } from "../api/userApi";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import UserProfileCard from "../components/user/UserProfileCard";
import { getApiError } from "../utils/getApiError";

export default function PublicUserProfilePage() {
  const { publicId } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
          <div className="max-w-md">
            <UserProfileCard user={user} />
          </div>
        )}
      </Container>
    </main>
  );
}
