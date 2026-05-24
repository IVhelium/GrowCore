import { LogOut, User } from "lucide-react";
import Button from "../common/Button";


export default function UserProfileCard({
    user,
    onLogout
}) {
    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid h-20 w-20 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
            <User size={36}/>
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-950">
            {user?.username}
        </h2>
        <p className="mt-1 text-slate-500">{user?.public_id}</p>
        <p className="mt-1 text-slate-500">{user?.email}</p>

        <div className="mt-6 grid gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-4">
                <div className="text-slate-500">Role</div>
                <div className="mt-1 font-semibold">{user?.role}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
                <div className="text-slate-500">Status</div>
                <div className="mt-1 font-semibold text-green-600">Active</div>
            </div>
        </div>

        <Button
            style="dark"
            onClick={onLogout}
            className="mt-6 w-full"
        >
            <LogOut size={18}/> Logout
        </Button>
      </aside>
    );
}