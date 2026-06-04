import { useState } from "react";
import { searchUserByPublicId } from "../api/userApi";
import { useAutoDismissMessage } from "../hooks/useAutoDismissMessage";
import { getApiError } from "./../utils/getApiError";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import { Search } from "lucide-react";
import UserAvatar from "../components/user/UserAvatar";

export default function UsersSearchPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useAutoDismissMessage("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);

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
      setIsLoading(false);
    }
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Users"
          title="Find a GrowCore user"
          text="Search by public ID, for example #A1B2C3D4E5"
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

          <Button type="submit" disabled={isLoading} className="rounded-none">
            <Search size={18} /> {isLoading ? "Searching..." : "Search"}
          </Button>
        </form>

        {error && (
          <p className="mt-6 max-w-xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {result && (
          <article className="mt-6 flex max-w-xl items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <UserAvatar user={result} size="md" />
            <div>
              <h2 className="font-bold text-slate-950">{result.username}</h2>
              <p className="mt-1 text-sm text-slate-500">{result.public_id}</p>
            </div>
          </article>
        )}
      </Container>
    </main>
  );
}
