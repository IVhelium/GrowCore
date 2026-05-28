import { Search } from "lucide-react";

export default function SearchBar({
  placeholder = "Search...",
  defaultValue = "",
  onSearch,
  className = "",
  buttonlabel = "",
}) {
  function handleSearch(event) {
    // Search function
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("search").trim();
    onSearch?.(query);
  }

  return (
    <form
      onSubmit={handleSearch}
      className={`flex overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`}
    >
      <input
        name="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full bg-transparent px-5 py-3 text-sm outline-none placeholder:text-slate-400"
      />
      <button
        type="submit"
        aria-label="Search"
        className="inline-flex min-h-44px items-center justify-center gap-2 border-l border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 transition hover:bg-[#4F8A5B] hover:text-white"
      >
        <Search size={18} />
        {buttonlabel && <span>{buttonlabel}</span>}
      </button>
    </form>
  );
}
