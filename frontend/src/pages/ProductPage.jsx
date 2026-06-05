import { useMemo, useState } from "react";
import {
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from "lucide-react";
import Container from "../components/common/Container";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import ProductGrid from "../components/product/ProductGrid";
import SectionTitle from "../components/common/SectionTitle";
import { formatPrice } from "../utils/formatPrice";

const fallbackImage =
  "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=900&auto=format&fit=crop";

const tabs = [
  { id: "description", label: "Description" },
  { id: "delivery", label: "Delivery" },
  { id: "reviews", label: "Reviews" },
];

function RatingStars({ value = 0 }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={16}
          fill={index < Math.round(value) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function ProductTabs({ product }) {
  const [activeTab, setActiveTab] = useState("description");
  const reviews = product.reviews || [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 border-b-2 px-5 py-4 text-sm font-bold transition ${
              activeTab === tab.id
                ? "border-[#4F8A5B] text-[#4F8A5B]"
                : "border-transparent text-slate-500 hover:text-slate-950"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-6">
        {activeTab === "description" && (
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Product description
            </h3>
            <p className="mt-3 leading-7 text-slate-600">
              {product.description}
            </p>
            {product.store?.description && (
              <p className="mt-4 leading-7 text-slate-600">
                {product.store.description}
              </p>
            )}
          </div>
        )}

        {activeTab === "delivery" && (
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Delivery and warranty
            </h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <Truck className="text-[#4F8A5B]" size={22} />
                  <h4 className="font-bold text-slate-950">Delivery</h4>
                </div>
                <p className="text-sm leading-6 text-slate-500">
                  Delivery options and price are calculated during checkout.
                </p>
              </article>

              <article className="rounded-xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <ShieldCheck className="text-[#4F8A5B]" size={22} />
                  <h4 className="font-bold text-slate-950">Seller warranty</h4>
                </div>
                <p className="text-sm leading-6 text-slate-500">
                  Warranty terms depend on the seller and component type.
                </p>
              </article>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Customer reviews
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {product.ratingCount} reviews from GrowCore buyers
                </p>
              </div>
              <RatingStars value={product.rating} />
            </div>

            <div className="mt-6 grid gap-4">
              {reviews.length === 0 && (
                <p className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
                  No reviews yet.
                </p>
              )}

              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="font-bold text-slate-950">
                        {review.user}
                      </h4>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatDate(review.date)}
                      </p>
                    </div>
                    <RatingStars value={review.rating} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {review.text || "No comment provided."}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ProductPage({
  product,
  relatedProducts = [],
  favoriteProductIds = [],
  isLoading = false,
  error = null,
  onAddToCart,
  onToggleFavorite,
}) {
  const images = useMemo(
    () => (product ? [product.image, ...(product.images || [])] : []),
    [product],
  );
  const uniqueImages = [...new Set(images.filter(Boolean))];
  const galleryImages = uniqueImages.length ? uniqueImages : [fallbackImage];
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);
  const [quantity, setQuantity] = useState(1);

  if (isLoading && !product) {
    return (
      <main>
        <Container className="py-10">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
            Loading product...
          </div>
        </Container>
      </main>
    );
  }

  if (!product) {
    return (
      <main>
        <Container className="py-10">
          <EmptyState
            title="Product not found"
            text={error ? "Could not load this product from the server" : "This product is not available"}
          />
        </Container>
      </main>
    );
  }

  const isFavorite = favoriteProductIds.includes(String(product.id));
  const maxQuantity = Math.max(0, Number(product.quantity) || 0);
  const canBuy = maxQuantity > 0;
  const selectedGalleryImage = galleryImages.includes(selectedImage)
    ? selectedImage
    : galleryImages[0];
  const selectedQuantity = canBuy ? Math.min(quantity, maxQuantity) : 1;

  return (
    <main>
      <Container className="py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(360px,560px)_minmax(0,1fr)] lg:items-start">
          <section className="grid w-full max-w-560px gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid aspect-square max-h-[min(560px,calc(100vh-180px))] place-items-center overflow-hidden rounded-xl bg-slate-50">
                <img
                  src={selectedGalleryImage}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {galleryImages.map((image) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-lg border bg-white p-1 transition ${
                      selectedGalleryImage === image
                        ? "border-[#4F8A5B]"
                        : "border-slate-200 hover:border-[#4F8A5B]"
                    }`}
                  >
                    <img
                      src={image}
                      alt=""
                      className="aspect-square w-full rounded-md object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-full">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#4F8A5B]/10 px-3 py-1 text-xs font-bold uppercase text-[#4F8A5B]">
                {product.category || "Product"}
              </span>
              {product.store?.name && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-500">
                  <Store size={13} />
                  {product.store.name}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {product.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <RatingStars value={product.rating} />
              <span className="text-sm font-semibold text-slate-700">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-sm text-slate-400">
                {product.ratingCount} reviews
              </span>
            </div>

            <p className="mt-5 leading-7 text-slate-600">
              {product.description}
            </p>

            <div className="mt-6 rounded-xl bg-slate-50 p-5">
              {product.oldPrice && (
                <div className="text-sm text-slate-400 line-through">
                  {formatPrice(product.oldPrice)}
                </div>
              )}
              <div className="text-4xl font-black text-slate-950">
                {formatPrice(product.price)}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Available: {maxQuantity} pcs.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={!canBuy}
                  className="grid h-10 w-10 place-items-center rounded-md hover:bg-slate-100 disabled:opacity-50"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-sm font-bold">
                  {selectedQuantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(maxQuantity, value + 1))
                  }
                  disabled={!canBuy || quantity >= maxQuantity}
                  className="grid h-10 w-10 place-items-center rounded-md hover:bg-slate-100 disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                disabled={!canBuy}
                onClick={() => onAddToCart?.(product, selectedQuantity)}
              >
                <ShoppingBag size={18} />
                {canBuy ? "Add to cart" : "Out of stock"}
              </Button>
              <Button
                style="secondary"
                onClick={() => onToggleFavorite?.(product)}
              >
                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                {isFavorite ? "Saved" : "Save"}
              </Button>
            </div>
          </aside>
        </div>

        <div className="mt-8">
          <ProductTabs product={product} />
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-10">
            <SectionTitle pretitle="Related" title="You may also need" />
            <ProductGrid
              products={relatedProducts}
              favoriteProductIds={favoriteProductIds}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
            />
          </section>
        )}
      </Container>
    </main>
  );
}
