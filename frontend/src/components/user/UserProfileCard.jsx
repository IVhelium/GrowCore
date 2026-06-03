import { CalendarDays, Hash, LogOut } from "lucide-react";
import Button from "../common/Button";
import UserAvatar from "./UserAvatar";


export default function UserProfileCard({
    user,
    onLogout
}) {
    const roles = user?.roles
      ?.map((userRole) => userRole?.role?.role || userRole?.role)
      .map((role) => role.toLowerCase())
      .filter(Boolean) || (user?.role ? [user.role] : []);

    const roleStyles = {
      user: "border-emerald-200 bg-emerald-50 text-emerald-700",
      seller: "border-amber-200 bg-amber-50 text-amber-700",
      support: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
      admin: "border-rose-200 bg-rose-50 text-rose-700",
    };

    const createdDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }) : "-";

    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <UserAvatar user={user} size="lg" />

        <h2 className="mt-5 text-2xl font-bold text-slate-950">
          {user?.username}
        </h2>

        <div className="mt-6 grid gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Hash size={15} /> Public ID
            </div>
            <div className="mt-1 font-semibold">{user?.public_id}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">Role</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {roles?.length ? (
                roles.map((role, index) => (
                  <span
                    key={`${role}-${index}`}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${roleStyles[role] || "border-slate-200 bg-white text-slate-700"} capitalize`}
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="font-semibold">-</span>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <CalendarDays size={15} /> Member since
            </div>
            <div className="mt-1 font-semibold">{createdDate}</div>
          </div>
        </div>

        <Button style="dark" onClick={onLogout} className="mt-6 w-full">
          <LogOut size={18} /> Logout
        </Button>
      </aside>
    );
}
