import CatalogPopoverCard from "./CatalogPopoverCard"
import { categories } from "../../data/testData"


export default function CatalogPopover({ onClose }) {
    return (
      <div className="w-full overflow-y-auto rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-5 overflow-hidden">
          {categories.map((category) => (
            <CatalogPopoverCard
              key={category.id}
              category={category}
              onClose={onClose}
            />
          ))}
        </div>
      </div>
    );
}