import { Link } from "react-router-dom";
import UserAvatar from "../user/UserAvatar";

export default function AccountPopover({ user, onLogout }) {
  const links = [
    ["/profile", "Profile"],
    ["/orders", "Orders"],
    ["/notifications", "Notifications"],
    ["/users", "Find members"],
  ];
  return (
    <div className="w-64 rounded-lg bg-white p-2">
      <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
        <UserAvatar user={user} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950">
            {user.username}
          </p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
      {links.map(([to, label]) => (
        <Link
          key={to}
          to={to}
          className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {label}
        </Link>
      ))}
      <button
        type="button"
        onClick={onLogout}
        className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        Logout
      </button>
    </div>
  );
}
