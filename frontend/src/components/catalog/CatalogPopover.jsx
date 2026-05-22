import CatalogPopoverCard from "./CatalogPopoverCard"


export default function CatalogPopover({ onClose }) {
    const categories = [
      { id: 1, name: "Ноутбуки" },
      { id: 2, name: "Смартфоны" },
      { id: 3, name: "Мониторы" },
      { id: 4, name: "Клавиатуры" },
      { id: 5, name: "Мышки" },
      { id: 6, name: "Наушники" },
      { id: 7, name: "Комплектующие" },
      { id: 8, name: "Аксессуары" },
    ];

    return (
      <div className="w-[min(920px, calc(100vw-32px))] overflow-y-auto rounded-lg bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-5 overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">Browse parts by category</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose sensors, irrigation parts, greenhouse modules, and replacement components
            </p>
          </div>
          <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <CatalogPopoverCard key={category.id} category={category} onClose={onClose}/>
            ))}
          </div>
        </div>
      </div>
    );
}