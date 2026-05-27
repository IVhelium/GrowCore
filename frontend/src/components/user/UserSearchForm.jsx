import { Search } from "lucide-react";
import Button from "../common/Button";
import FormField from "../common/FormField";

export default function UserSearchForm({ onSearch }) {
  function handleSubmit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    onSearch?.(data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end">
        <FormField label="Search" name="query" placeholder="Name or email" />

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Role</span>
          <select
            name="rolde"
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4F8A5B]"
          >
            <option value="">Any Role</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
          </select>
        </label>

        <Button>
          <Search size={18} /> Search
        </Button>
      </div>
    </form>
  );
}
