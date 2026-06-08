import { Link } from "react-router-dom";
import UserAvatar from "./UserAvatar";

export default function UserMiniCard({ user }) {
  return (
    <Link
      to={`/users/${encodeURIComponent(user?.public_id || "")}`}
      className="flex items-center gap-3 rounded-lg p-1 transition hover:bg-slate-50"
    >
      <UserAvatar user={user} size="sm" />

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">
          {user?.username || "Unknown user"}
        </p>

        {user?.public_id && (
          <p className="truncate text-xs text-slate-400">{user.public_id}</p>
        )}
      </div>
    </Link>
  );
}
