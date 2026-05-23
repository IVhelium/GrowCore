import { User } from "lucide-react";


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
        <p className="mt-1 text-slate-500">{user?.email}</p>
      </aside>
    );
}