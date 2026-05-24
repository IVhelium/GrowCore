import { Shield, User } from "lucide-react";
import EmptyState from "../common/EmptyState";


export default function UserSearchResult({ users = [] }) {
    if (!users.length) {
        return <EmptyState title="No users found" text="Try changing your search query or filters"/>;
    }

    return (
      <div className="grid gap-4">
        {users.map((user) => (
          <article
            key={user.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rpunded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                    <User size={24}/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-950">{user.username}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">{user.public_id}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                    <Shield size={15}/> {user.role}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
}