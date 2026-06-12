import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { getFriends } from "../api/userApi";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import PaginationBar from "../components/common/PaginationBar";
import UserAvatar from "../components/user/UserAvatar";
import { useAutoDismissMessage } from "../hooks/useAutoDismissMessage";
import { getApiError } from "../utils/getApiError";

const PAGE_SIZE = 18;

function FriendCard({ user }) {
  return (
    <Link
      to={`/users/${encodeURIComponent(user.public_id)}`}
      className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#4F8A5B]"
    >
      <UserAvatar user={user} size="md" />
      <div className="min-w-0">
        <h2 className="truncate font-bold text-slate-950">{user.username}</h2>
        <p className="mt-1 truncate text-sm text-slate-500">{user.public_id}</p>
      </div>
    </Link>
  );
}

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useAutoDismissMessage("");

  useEffect(() => {
    let isActive = true;

    async function loadFriends() {
      setIsLoading(true);

      try {
        const page = await getFriends({
          limit: PAGE_SIZE,
          offset: (currentPage - 1) * PAGE_SIZE,
          search: appliedSearch,
        });

        if (isActive) {
          setFriends(page.items || []);
          setTotal(page.total || 0);
        }
      } catch (requestError) {
        if (isActive) {
          setError(getApiError(requestError, "Could not load friends"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadFriends();

    return () => {
      isActive = false;
    };
  }, [appliedSearch, currentPage, setError]);

  function handleSubmit(event) {
    event.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(search.trim());
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Friends"
          title="Your friends"
          text="Search friends by username or public ID."
        />

        <form
          onSubmit={handleSubmit}
          className="flex max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Username or #A1B2C3D4E5"
            className="w-full px-5 py-3 text-sm outline-none placeholder:text-slate-400"
          />
          <Button type="submit" className="rounded-none">
            <Search size={18} />
            Search
          </Button>
        </form>

        {error && (
          <p className="mt-6 max-w-xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Loading friends...
          </div>
        ) : friends.length === 0 ? (
          <EmptyState title="No friends found" text="Add friends from public profiles." />
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {friends.map((friend) => (
              <FriendCard key={friend.public_id} user={friend} />
            ))}
          </div>
        )}

        <PaginationBar
          current={currentPage}
          total={total}
          pageSize={PAGE_SIZE}
          onChange={setCurrentPage}
        />
      </Container>
    </main>
  );
}
