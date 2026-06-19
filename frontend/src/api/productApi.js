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
    price: Number(product.discounted_price ?? product.price),
    originalPrice: Number(product.price),
    discountPercent: Number(product.discount_percent || 0),
    discountExpiresAt: product.discount_expires_at || null,
    hasDiscount: Boolean(product.has_discount),
    oldPrice: product.has_discount
      ? Number(product.price)
      : null,
    label: product.category?.name || "Product",
    category: product.category?.name || "",
    image: images[0] ||
      resolvestorageUrl(primaryImage) ||
      "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=700&auto=format&fit=crop",
    images,
    rating: Number(product.rating_avg ?? 0),
    ratingCount: product.rating_count ?? 0,
    quantity: product.quantity,
    attributes: product.attributes || {},
    enabled: product.enabled,
    moderationStatus: product.moderation_status,
    rejectionReason: product.rejection_reason,
    deletionReason: product.deletion_reason,
    deletedAt: product.deleted_at,
    store: product.store || null,
    reviews: (product.reviews || []).map((review) => ({
      id: review.id,
      rating: review.rating === null || review.rating === undefined
        ? null
        : Number(review.rating),
      text: review.comment || "",
      date: review.created_at,
      parentId: review.parent_id,
      user: review.user || null,
    })),
    raw: product,
  };
}

export async function getProducts({
  limit = PRODUCT_LIST_LIMIT,
  offset = 0,
  search,
  categoryId,
  filters = {},
  sort = "new",
} = {}) {
  const { data } = await apiClient.get("/products", {
    params: {
      ...getPaginationParams({ limit, offset }),
      search: search || undefined,
      category_id: categoryId || undefined,
      min_price: filters.minPrice || undefined,
      max_price: filters.maxPrice || undefined,
      seller: filters.seller || undefined,
      availability: filters.availability || undefined,
      label: filters.label || undefined,
      attributes: Object.entries(filters.attributes || {}).flatMap(([name, values]) => (Array.isArray(values) ? values : [values]).map((value) => `${name}:${value}`)),
      sort,
    },
    paramsSerializer: { indexes: null },
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

export async function createProductReview(productId, payload) {
  const { data } = await apiClient.post(`/products/${productId}/reviews`, {
    rating: Number(payload.rating),
    comment: payload.comment || "",
  });

  return normalizeProduct(data);
}

export async function createProductReviewReply(productId, reviewId, payload) {
  const { data } = await apiClient.post(
    `/products/${productId}/reviews/${reviewId}/replies`,
    {
      comment: payload.comment || "",
    },
  );

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

export async function getAdminProducts({ limit = 20, offset = 0 } = {}) {
  const { data } = await apiClient.get("/admin/products", {
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

export async function blockProduct(productId, reason) {
  const { data } = await apiClient.patch(`/admin/products/${productId}/block`, {
    reason,
  });

  return normalizeProduct(data);
}

export async function deleteAdminProduct(productId, reason) {
  const { data } = await apiClient.delete(`/admin/products/${productId}`, {
    data: { reason },
  });

  return normalizeProduct(data);
}

export async function getMySellerProducts({ limit = 20, offset = 0 } = {}) {
  const { data } = await apiClient.get("/seller/products", {
    params: getPaginationParams({ limit, offset }),
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeProduct),
  };
}

export async function getMySellerProduct(productId) {
  const { data } = await apiClient.get(`/seller/products/${productId}`);
  return normalizeProduct(data);
}

export async function createSellerProduct(payload) {
  const { data } = await apiClient.post("/seller/products", {
    title: payload.title,
    description: payload.description,
    price: Number(payload.price),
    discount_percent: Number(payload.discountPercent || 0),
    discount_expires_at: payload.discountExpiresAt || null,
    quantity: Number(payload.quantity),
    category_id: Number(payload.categoryId),
    attributes: payload.attributes || {},
  });

  return normalizeProduct(data);
}

export async function updateSellerProduct(productId, payload) {
  const body = {
    title: payload.title || undefined,
    description: payload.description || undefined,
    price: payload.price === "" ? undefined : Number(payload.price),
    discount_percent: payload.discountPercent === ""
      ? undefined
      : Number(payload.discountPercent || 0),
    discount_expires_at: payload.discountExpiresAt === undefined
      ? undefined
      : payload.discountExpiresAt || null,
    quantity: payload.quantity === "" ? undefined : Number(payload.quantity),
    category_id: payload.categoryId ? Number(payload.categoryId) : undefined,
    attributes: payload.attributes,
  };

  const { data } = await apiClient.patch(`/seller/products/${productId}`, body);
  return normalizeProduct(data);
}

export async function uploadSellerProductImage(productId, file) {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await apiClient.post(
    `/seller/products/${productId}/images`,
    formData,
  );

  return normalizeProduct(data);
}

export async function submitSellerProduct(productId) {
  const { data } = await apiClient.post(`/seller/products/${productId}/submit`);
  return normalizeProduct(data);
}

export async function deleteSellerProduct(productId, reason) {
  await apiClient.delete(`/seller/products/${productId}`, {
    data: { reason },
  });
}
