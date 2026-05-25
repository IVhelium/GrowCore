import { CalendarDays, Hash, LogOut } from "lucide-react";
import Button from "../common/Button";
import UserAvatar from "./UserAvatar";


export default function UserProfileCard({
    user,
    onLogout
}) {
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
            <div className="mt-1 font-semibold">{user?.role}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500"><CalendarDays size={15}/> Member since</div>
            <div className="mt-1 font-semibold">{createdDate}</div>
          </div>
        </div>

        <Button style="dark" onClick={onLogout} className="mt-6 w-full">
          <LogOut size={18} /> Logout
        </Button>
      </aside>
    );
}