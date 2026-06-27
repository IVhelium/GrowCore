import { Link } from "react-router-dom";
import ImageWithFallback from "../common/ImageWithFallback";

function StoreContent({ store, products }) {
  return (
    <>
      <div className="shrink-0 border-b border-slate-100 bg-white p-5">
        <div className="flex min-w-0 items-center gap-4">
          <ImageWithFallback
            src={products[0]?.image}
            alt={store.name}
            className="h-16 w-16 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-slate-950">
              {store.name}
            </h2>
            <p className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-slate-500">
              {store.description || "Seller store"}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:border-[#4F8A5B]"
            >
              <ImageWithFallback
                src={product.image}
                alt={product.title}
                className="h-14 w-14 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">
                  {product.title}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {product.category || "Product"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default function PublicProfileStorePanel({ store, products, embedded = false }) {
  if (!store) {
    return null;
  }

  if (embedded) {
    return (
      <div className="flex h-full min-w-0 flex-col overflow-hidden bg-white">
        <StoreContent store={store} products={products} />
      </div>
    );
  }

  return (
    <aside className="flex h-[640px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <StoreContent store={store} products={products} />
    </aside>
  );
}
