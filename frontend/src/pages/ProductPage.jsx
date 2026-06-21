import { useMemo, useState } from "react";
import {
  Heart,
  MessageSquare,
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
import UserMiniCard from "../components/user/UserMiniCard";
import { formatPrice } from "../utils/formatPrice";
import { formatDate } from "../utils/formatDateTime";
import { getApiError } from "../utils/getApiError";

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

function getReviewThreads(reviews) {
  const repliesByParent = reviews.reduce((groups, review) => {
    if (!review.parentId) return groups;

    groups[review.parentId] = [...(groups[review.parentId] || []), review];
    return groups;
  }, {});

  return reviews
    .filter((review) => !review.parentId && review.rating !== null)
    .map((review) => ({
      ...review,
      replies: repliesByParent[review.id] || [],
    }));
}

function ProductTabs({ product, currentUser, onReviewSubmit, onReviewReply }) {
  const [activeTab, setActiveTab] = useState("description");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyComment, setReplyComment] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replyBusyId, setReplyBusyId] = useState(null);
  const reviews = product.reviews || [];
  const reviewThreads = getReviewThreads(reviews);
  const hasOwnReview = Boolean(
    currentUser?.public_id &&
      reviewThreads.some(
        (review) => review.user?.public_id === currentUser.public_id,
      ),
  );

  async function handleReviewSubmit(event) {
    event.preventDefault();

    if (!onReviewSubmit) {
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Review cannot be empty.");
      return;
    }

    setIsReviewSubmitting(true);
    setReviewError("");

    try {
      await onReviewSubmit({
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewRating(5);
      setReviewComment("");
    } catch (error) {
      setReviewError(getApiError(error, "Could not add review"));
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  async function handleReplySubmit(event, reviewId) {
    event.preventDefault();

    if (!replyComment.trim()) {
      setReplyError("Reply cannot be empty.");
      return;
    }

    setReplyBusyId(reviewId);
    setReplyError("");

    try {
      await onReviewReply?.(reviewId, {
        comment: replyComment.trim(),
      });
      setReplyingToId(null);
      setReplyComment("");
    } catch (error) {
      setReplyError(getApiError(error, "Could not add reply"));
    } finally {
      setReplyBusyId(null);
    }
  }

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
              {!hasOwnReview ? (
                <form
                  onSubmit={handleReviewSubmit}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="font-bold text-slate-950">
                        Leave a review
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        You can leave one rated review per product.
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const value = index + 1;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setReviewRating(value)}
                            aria-label={`Rate ${value} stars`}
                            className="grid h-9 w-9 place-items-center rounded-md text-amber-500 transition hover:bg-white"
                          >
                            <Star
                              size={20}
                              fill={value <= reviewRating ? "currentColor" : "none"}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => {
                      setReviewComment(event.target.value);
                      if (reviewError) {
                        setReviewError("");
                      }
                    }}
                    placeholder="Write your review..."
                    required
                    maxLength={2000}
                    rows={4}
                    className={`mt-4 w-full resize-none rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:border-[#4F8A5B] ${
                      reviewError ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {reviewError && (
                    <p className="mt-2 text-sm font-semibold text-red-600">
                      {reviewError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={isReviewSubmitting}
                    className="mt-4"
                  >
                    {isReviewSubmitting ? "Sending..." : "Submit review"}
                  </Button>
                </form>
              ) : (
                <div className="rounded-xl border border-[#4F8A5B]/20 bg-[#4F8A5B]/5 p-5 text-sm font-semibold text-[#3F7148]">
                  You already left a rated review. You can still reply to other comments.
                </div>
              )}

              {reviewThreads.length === 0 && (
                <p className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
                  No reviews yet.
                </p>
              )}

              {reviewThreads.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <UserMiniCard user={review.user} />
                      <p className="mt-1 pl-1 text-sm text-slate-400">
                        {formatDate(review.date)}
                      </p>
                    </div>
                    <RatingStars value={review.rating} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {review.text || "No comment provided."}
                  </p>

                  <div className="mt-4">
                    <Button
                      type="button"
                      style="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingToId((currentId) =>
                          currentId === review.id ? null : review.id,
                        );
                        setReplyComment("");
                        setReplyError("");
                      }}
                    >
                      <MessageSquare size={16} />
                      Reply
                    </Button>
                  </div>

                  {replyingToId === review.id && (
                    <form
                      onSubmit={(event) => handleReplySubmit(event, review.id)}
                      className="mt-4 rounded-lg bg-slate-50 p-4"
                    >
                      <textarea
                        value={replyComment}
                        onChange={(event) => {
                          setReplyComment(event.target.value);
                          if (replyError) {
                            setReplyError("");
                          }
                        }}
                        placeholder="Write a reply..."
                        required
                        maxLength={2000}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4F8A5B]"
                      />
                      {replyError && (
                        <p className="mt-2 text-sm font-semibold text-red-600">
                          {replyError}
                        </p>
                      )}
                      <Button
                        type="submit"
                        size="sm"
                        disabled={replyBusyId === review.id}
                        className="mt-3"
                      >
                        {replyBusyId === review.id ? "Sending..." : "Send reply"}
                      </Button>
                    </form>
                  )}

                  {review.replies.length > 0 && (
                    <div className="mt-5 grid gap-3 border-l-2 border-slate-100 pl-4">
                      {review.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="rounded-lg bg-slate-50 p-4"
                        >
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <UserMiniCard user={reply.user} />
                            <p className="pl-1 text-sm text-slate-400">
                              {formatDate(reply.date)}
                            </p>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {reply.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
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
  onReviewSubmit,
  onReviewReply,
  currentUser,
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
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-400 line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                  <span className="rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-600">
                    -{product.discountPercent}%
                  </span>
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
          <ProductTabs
            product={product}
            currentUser={currentUser}
            onReviewSubmit={onReviewSubmit}
            onReviewReply={onReviewReply}
          />
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
