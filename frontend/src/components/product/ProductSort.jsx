

export default function ProductSort({ onChange }) {
    return (
      <select
        onChange={(event) => onChange?.(event.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#4F8A5B]"
      >
        <option value="random">Random</option>
        <option value="popular">Most popular</option>
        <option value="price-asc">Lowest price</option>
        <option value="price-des">Highest price</option>
        <option value="new">Newest</option>
      </select>
    );
}