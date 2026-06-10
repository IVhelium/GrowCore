import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { getUsers, searchUserByPublicId } from "../api/userApi";
import { useAutoDismissMessage } from "../hooks/useAutoDismissMessage";
import { getApiError } from "./../utils/getApiError";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import PaginationBar from "../components/common/PaginationBar";
import UserAvatar from "../components/user/UserAvatar";

const PAGE_SIZE = 12;

function UserResultCard({ user }) {
  return (
    <Link
      to={`/users/${encodeURIComponent(user.public_id)}`}
      className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#4F8A5B]"
    >
      <UserAvatar user={user} size="md" />
      <div className="min-w-0">
        <h2 className="truncate font-bold text-slate-950">{user.username}</h2>
        <p className="mt-1 truncate text-sm text-slate-500">{user.public_id}</p>
        {user.isBlocked && (
          <p className="mt-2 w-fit rounded-lg bg-red-50 px-2 py-1 text-xs font-bold uppercase text-red-600">
            blocked
          </p>
        )}
      </div>
    </Link>
  );
}

export default function UsersSearchPage() {
  const [users, setUsers] = useState([]);
  const [result, setResult] = useState(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useAutoDismissMessage("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadUsers() {
      setIsLoading(true);

      try {
        const page = await getUsers({
          limit: PAGE_SIZE,
          offset: (currentPage - 1) * PAGE_SIZE,
        });

        if (isActive) {
          setUsers(page.items || []);
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
  }, [currentPage, setError]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsSearchLoading(true);

    const publicId = new FormData(event.currentTarget)
      .get("public_id")
      .trim()
      .toUpperCase();

    try {
      const user = await searchUserByPublicId(publicId);
      setResult(user);
    } catch (requestError) {
      setError(getApiError(requestError, "User not found"));
    } finally {
      setIsSearchLoading(false);
    }
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Users"
          title="Find a GrowCore user"
          text="Browse all members or search by public ID, for example #A1B2C3D4E5"
        />

        <form
          onSubmit={handleSubmit}
          className="flex max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <input
            name="public_id"
            required
            pattern="#[0-9A-Fa-f]{10}"
            placeholder="#A1B2C3D4E5"
            className="w-full px-5 py-3 text-sm uppercase outline-none placeholder:text-slate-400"
          />

          <Button type="submit" disabled={isSearchLoading} className="rounded-none">
            <Search size={18} /> {isSearchLoading ? "Searching..." : "Search"}
          </Button>
        </form>

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

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-950">All users</h2>

          {isLoading ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
              Loading users...
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {users.map((user) => (
                <UserResultCard key={user.public_id} user={user} />
              ))}
            </div>
          )}

          <PaginationBar
            current={currentPage}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={setCurrentPage}
          />
        </section>
      </Container>
    </main>
  );
}
