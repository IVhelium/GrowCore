import { useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import Container from "../components/common/Container";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import ImageWithFallback from "../components/common/ImageWithFallback";
import ProductGrid from "../components/product/ProductGrid";
import SectionTitle from "../components/common/SectionTitle";
import UserMiniCard from "../components/user/UserMiniCard";
import { formatPrice } from "../utils/formatPrice";
import { formatDate } from "../utils/formatDateTime";
import { getApiError } from "../utils/getApiError";
import { useActionDialog } from "../hooks/useActionDialog";
import {
  parseProductDescription,
  PRODUCT_DESCRIPTION_SECTIONS,
} from "../utils/productDescriptionTemplate";

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

function ProductDescriptionView({ description = "", storeDescription = "" }) {
  const sections = parseProductDescription(description);
  const hasStructuredDescription = PRODUCT_DESCRIPTION_SECTIONS.some((section) =>
    sections[section.key]?.trim(),
  );

  if (!hasStructuredDescription) {
    return (
      <div>
        <h3 className="text-xl font-bold text-slate-950">
          Product description
        </h3>
        <p className="mt-3 leading-7 text-slate-600">
          {description}
        </p>
        {storeDescription && (
          <p className="mt-4 leading-7 text-slate-600">
            {storeDescription}
          </p>
        )}
      </div>
    );
  }

  function getCharacteristicRows(value = "") {
    return value
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .map((line) => {
        const [name, ...rest] = line.split(":");
        return {
          name: name?.trim() || "Characteristic",
          value: rest.join(":").trim(),
        };
      });
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-950">
        Product description
      </h3>
      <div className="mt-5 grid gap-5">
        {PRODUCT_DESCRIPTION_SECTIONS.map((section) => {
          const value = sections[section.key]?.trim();

          if (!value) return null;

          if (section.key === "characteristics") {
            const rows = getCharacteristicRows(value);

            return (
              <section key={section.key} className="grid gap-3">
                <h4 className="text-sm font-bold uppercase text-slate-400">
                  {section.label}
                </h4>
                <div className="grid gap-2">
                  {rows.map((row, index) => (
                    <div
                      key={`${row.name}-${index}`}
                      className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[180px_minmax(0,1fr)]"
                    >
                      <span className="text-sm font-bold text-slate-700">
                        {row.name}
                      </span>
                      <span className="text-sm leading-6 text-slate-600">
                        {row.value || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return (
            <section key={section.key} className="grid gap-2">
              <h4 className="text-sm font-bold uppercase text-slate-400">
                {section.label}
              </h4>
              <p className="leading-7 text-slate-600 whitespace-pre-line">
                {value}
              </p>
            </section>
          );
        })}
      </div>
      {storeDescription && (
        <p className="mt-5 leading-7 text-slate-600">
          {storeDescription}
        </p>
      )}
    </div>
  );
}

function getProductSummary(description = "") {
  const sections = parseProductDescription(description);
  return sections.overview?.trim() || description;
}

function hasRole(user, role) {
  return (user?.roles || []).some((item) => item.role?.role === role || item.role === role);
}

function getPublicId(user) {
  return user?.public_id || user?.publicId || "";
}

function ProductTabs({
  product,
  currentUser,
  onReviewSubmit,
  onReviewReply,
  onReviewDelete,
}) {
  const { confirmAction } = useActionDialog();
  const [activeTab, setActiveTab] = useState("description");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyComment, setReplyComment] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replyBusyId, setReplyBusyId] = useState(null);
  const [deleteBusyId, setDeleteBusyId] = useState(null);
  const reviews = product.reviews || [];
  const reviewThreads = getReviewThreads(reviews);
  const isAdmin = hasRole(currentUser, "admin");
  const currentUserPublicId = getPublicId(currentUser);
  const hasOwnReview = Boolean(
    currentUserPublicId &&
      reviewThreads.some(
        (review) => getPublicId(review.user) === currentUserPublicId,
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

  function canDeleteReview(review) {
    return Boolean(
      onReviewDelete &&
        currentUserPublicId &&
        (isAdmin || getPublicId(review.user) === currentUserPublicId),
    );
  }

  async function handleReviewDelete(review) {
    const confirmed = await confirmAction({
      title: review.parentId ? "Delete reply?" : "Delete review?",
      description: review.parentId
        ? "This reply will be removed from the discussion."
        : "This review and its replies will be removed. Product rating will be recalculated.",
      confirmLabel: "Delete",
      tone: "danger",
    });

    if (!confirmed) return;

    setDeleteBusyId(review.id);
    setReviewError("");
    setReplyError("");

    try {
      await onReviewDelete?.(review.id);
    } catch (error) {
      setReviewError(getApiError(error, "Could not delete review"));
    } finally {
      setDeleteBusyId(null);
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
          <ProductDescriptionView
            description={product.description}
            storeDescription={product.store?.description}
          />
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

                  <div className="mt-4 flex flex-wrap gap-2">
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
                    {canDeleteReview(review) && (
                      <Button
                        type="button"
                        style="danger"
                        size="sm"
                        disabled={deleteBusyId === review.id}
                        onClick={() => handleReviewDelete(review)}
                      >
                        <Trash2 size={16} />
                        {deleteBusyId === review.id ? "Deleting..." : "Delete"}
                      </Button>
                    )}
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
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="pl-1 text-sm text-slate-400">
                                {formatDate(reply.date)}
                              </p>
                              {canDeleteReview(reply) && (
                                <Button
                                  type="button"
                                  style="danger"
                                  size="sm"
                                  disabled={deleteBusyId === reply.id}
                                  onClick={() => handleReviewDelete(reply)}
                                >
                                  <Trash2 size={16} />
                                  {deleteBusyId === reply.id ? "Deleting..." : "Delete"}
                                </Button>
                              )}
                            </div>
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
  onReviewDelete,
  currentUser,
}) {
  const images = useMemo(
    () => (product ? [product.image, ...(product.images || [])] : []),
    [product],
  );
  const uniqueImages = [...new Set(images.filter(Boolean))];
  const galleryImages = uniqueImages;
  const [selectedImage, setSelectedImage] = useState(galleryImages[0] || "");
  const [quantity, setQuantity] = useState(1);
  const thumbnailTrackRef = useRef(null);

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
    : galleryImages[0] || "";
  const selectedGalleryIndex = Math.max(
    0,
    galleryImages.indexOf(selectedGalleryImage),
  );
  const selectedQuantity = canBuy ? Math.min(quantity, maxQuantity) : 1;
  const productSummary = getProductSummary(product.description);

  function showPreviousImage() {
    setSelectedImage(
      galleryImages[
        (selectedGalleryIndex - 1 + galleryImages.length) % galleryImages.length
      ],
    );
  }

  function showNextImage() {
    setSelectedImage(
      galleryImages[(selectedGalleryIndex + 1) % galleryImages.length],
    );
  }

  function scrollThumbnailTrack(direction) {
    const scrollAmount = thumbnailTrackRef.current?.clientWidth
      ? thumbnailTrackRef.current.clientWidth * 0.8
      : 220;

    thumbnailTrackRef.current?.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  }

  return (
    <main>
      <Container className="py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(360px,560px)_minmax(0,1fr)] lg:items-start">
          <section className="grid w-full min-w-0 max-w-full gap-4 lg:max-w-560px">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
              <div className="relative grid aspect-square max-h-[min(560px,calc(100vh-180px))] place-items-center overflow-hidden rounded-xl bg-slate-50">
                <ImageWithFallback
                  src={selectedGalleryImage}
                  alt={product.title}
                  className="h-full w-full object-cover"
                  iconSize={52}
                />
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      aria-label="Show previous product image"
                      className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white hover:text-[#4F8A5B] sm:left-3 sm:h-11 sm:w-11"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      aria-label="Show next product image"
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white hover:text-[#4F8A5B] sm:right-3 sm:h-11 sm:w-11"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-bold text-white">
                      {selectedGalleryIndex + 1} / {galleryImages.length}
                    </div>
                  </>
                )}
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="relative min-w-0 max-w-full overflow-hidden">
                <button
                  type="button"
                  onClick={() => scrollThumbnailTrack(-1)}
                  aria-label="Scroll product thumbnails left"
                  className="absolute left-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:border-[#4F8A5B] hover:text-[#4F8A5B] sm:h-10 sm:w-10"
                >
                  <ChevronLeft size={18} />
                </button>
                <div
                  ref={thumbnailTrackRef}
                  className="flex min-w-0 snap-x gap-2 overflow-x-auto scroll-smooth px-11 pb-1 scrollbar-width:none sm:gap-3 sm:px-12 [&::-webkit-scrollbar]:hidden"
                >
                  {galleryImages.map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`h-[clamp(64px,18vw,96px)] w-[clamp(64px,18vw,96px)] shrink-0 snap-start overflow-hidden rounded-lg border bg-white p-1 transition ${
                        selectedGalleryImage === image
                          ? "border-[#4F8A5B]"
                          : "border-slate-200 hover:border-[#4F8A5B]"
                      }`}
                    >
                      <ImageWithFallback
                        src={image}
                        alt=""
                        className="h-full w-full rounded-md object-cover"
                        iconSize={22}
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => scrollThumbnailTrack(1)}
                  aria-label="Scroll product thumbnails right"
                  className="absolute right-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:border-[#4F8A5B] hover:text-[#4F8A5B] sm:h-10 sm:w-10"
                >
                  <ChevronRight size={18} />
                </button>
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

            <p className="product-detail-summary mt-5 leading-7 text-slate-600">
              {productSummary}
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
            onReviewDelete={onReviewDelete}
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
