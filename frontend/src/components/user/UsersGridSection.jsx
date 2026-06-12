import PaginationBar from "../common/PaginationBar";
import UserResultCard from "./UserResultCard";

export default function UsersGridSection({
  users,
  isLoading,
  currentPage,
  total,
  pageSize,
  onPageChange,
}) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold text-slate-950">All users</h2>

      {isLoading ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
          Loading users...
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <UserResultCard key={user.public_id} user={user} />
          ))}
        </div>
      )}

      <PaginationBar
        current={currentPage}
        total={total}
        pageSize={pageSize}
        onChange={onPageChange}
      />
    </section>
  );
}
