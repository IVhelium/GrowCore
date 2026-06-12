import { Link } from "react-router-dom";
import UserAvatar from "./UserAvatar";

export default function UserResultCard({ user }) {
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
