import { apiClient, getPaginationParams, resolvestorageUrl } from "./apiClient";

const PRODUCT_LIST_LIMIT = 100;

export function normalizeProduct(product) {
  const primaryImage = product.images?.[0]?.image;
  const images = (product.images || [])
    .map((item) => resolvestorageUrl(item.image))
    .filter(Boolean);

  return {
    id: product.id,
    categoryId: product.category?.id ?? null,
    title: product.title,
    description: product.description,
    price: Number(product.price),
    oldPrice: null,
    label: product.category?.name || "Product",
    category: product.category?.name || "",
    image: images[0] ||
      resolvestorageUrl(primaryImage) ||
      "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=700&auto=format&fit=crop",
    images,
    rating: Number(product.rating_avg ?? 0),
    ratingCount: product.rating_count ?? 0,
    quantity: product.quantity,
    enabled: product.enabled,
    moderationStatus: product.moderation_status,
    rejectionReason: product.rejection_reason,
    store: product.store || null,
    reviews: (product.reviews || []).map((review) => ({
      id: review.id,
      rating: Number(review.rating ?? 0),
      text: review.comment || "",
      date: review.created_at,
      user: review.user?.username || "GrowCore user",
    })),
    raw: product,
  };
}

export async function getProducts({
  limit = PRODUCT_LIST_LIMIT,
  offset = 0,
  search,
  categoryId,
} = {}) {
  const { data } = await apiClient.get("/products", {
    params: {
      ...getPaginationParams({ limit, offset }),
      search: search || undefined,
      category_id: categoryId || undefined,
    },
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeProduct),
  };
}

export async function getProduct(productId) {
  const { data } = await apiClient.get(`/products/${productId}`);
  return normalizeProduct(data);
}

export async function getPendingProducts({ limit = 20, offset = 0 } = {}) {
  const { data } = await apiClient.get("/admin/products/moderation", {
    params: getPaginationParams({ limit, offset }),
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeProduct),
  };
}

export async function approveProduct(productId) {
  const { data } = await apiClient.patch(
    `/admin/products/moderation/${productId}/approve`,
  );

  return normalizeProduct(data);
}

export async function rejectProduct(productId, reason) {
  const { data } = await apiClient.patch(
    `/admin/products/moderation/${productId}/reject`,
    { reason },
  );

  return normalizeProduct(data);
}
