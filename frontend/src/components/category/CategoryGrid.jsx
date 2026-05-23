import CategoryCard from "./CategoryCard";


export default function CategoryGrid({ categories = [] }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
                <CategoryCard key={category.id} category={category}/>
            ))}
        </div>
    );
}