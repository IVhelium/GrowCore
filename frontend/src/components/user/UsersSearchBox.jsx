import { Search } from "lucide-react";
import Button from "../common/Button";

export default function UsersSearchBox({
  value,
  onChange,
  onSubmit,
  isLoading = false,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <input
        name="search"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Username or #A1B2C3D4E5"
        className="w-full px-5 py-3 text-sm outline-none placeholder:text-slate-400"
      />

      <Button type="submit" disabled={isLoading} className="rounded-none">
        <Search size={18} /> {isLoading ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}
