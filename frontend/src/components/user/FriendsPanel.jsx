import { Search } from "lucide-react";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import PaginationBar from "../common/PaginationBar";
import UserAvatar from "./UserAvatar";
import UserResultCard from "./UserResultCard";

export default function FriendsPanel({
  isAuthenticated,
  friendRequests,
  friends,
  search,
  isLoading,
  currentPage,
  total,
  pageSize,
  onSearchChange,
  onSearchSubmit,
  onPageChange,
  onRequestAction,
}) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold text-slate-950">Friends</h2>

      {!isAuthenticated ? (
        <EmptyState title="Sign in to see friends" text="Your friends appear here."/>
      ) : (
        <>
          {friendRequests.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-bold text-amber-950">Friend requests</h3>
              <div className="mt-3 grid gap-3">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar user={request.requester} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {request.requester.username}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {request.requester.public_id}
                        </p>
                        {request.message && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                            {request.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onRequestAction(request.id, "accept")}
                      >
                        Accept
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        style="secondary"
                        onClick={() => onRequestAction(request.id, "decline")}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={onSearchSubmit}
            className="my-4 flex max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Username or #A1B2C3D4E5"
              className="w-full px-5 py-3 text-sm outline-none placeholder:text-slate-400"
            />
            <Button type="submit" className="rounded-none">
              <Search size={18} />
              Search
            </Button>
          </form>

          {isLoading ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
              Loading friends...
            </div>
          ) : friends.length === 0 ? (
            <EmptyState title="No friends found" text="Add friends from public profiles."/>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {friends.map((friend) => (
                <UserResultCard key={friend.public_id} user={friend} />
              ))}
            </div>
          )}

          <PaginationBar
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={onPageChange}
          />
        </>
      )}
    </section>
  );
}
