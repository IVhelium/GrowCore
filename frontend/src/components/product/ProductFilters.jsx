import { categories } from "../../data/testData";


export default function ProductFilters({ onChange }) {
    function handleSubmit(event) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        onChange?.(data)
    }

    return (
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">Filters</h2>
          <button type="reset" className="text-sm font-semibold text-[#4F8A5B]">
            Reset
          </button>
        </div>

        <div className="grid gap-6">
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-950">
                Category
              </h3>
              <div className="grid gap-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                  >
                    <input
                      name="category"
                      value={category.id}
                      type="radio"
                      className="h-4 w-4 accent-[#4F8A5B]"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-950">Price</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="minPrice"
                  placeholder="From"
                  className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4F8A5B]"
                />
                <input
                  name="maxPrice"
                  placeholder="To"
                  className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4F8A5B]"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-950">Label</h3>
              <div className="flex flex-wrap gap-2">
                {["Deal", "New", "Hot", "Popular"].map((tag) => (
                  <label
                    key={tag}
                    className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
                  >
                    <input
                        name="label"
                        value={tag}
                        type="checkbox"
                        className="sr-only"
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>

            <button className="rounded-lg bg-[#4F8A5B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3F7148]">
                Apply filters
            </button>
        </div>
      </form>
    );
}
