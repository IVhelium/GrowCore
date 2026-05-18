import { Link } from "react-router-dom";


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
      <div className="w-full h-full overflow-y-auto rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/catalog?category=${category.id}`}
              onClick={onClose}
              className="block w-full rounded-lg text-sm font-medium hover:bg-[#7188D4]/10 hover:text-[#7188D4]"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    );
}