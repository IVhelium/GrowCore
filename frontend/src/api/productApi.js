import { apiClient, getPaginationParams, resolvestorageUrl } from "./apiClient";

// Default number of catalogue products requested in one public list.
const PRODUCT_LIST_LIMIT = 100;

export function normalizeProduct(product) {
  // Maps backend product fields, images, reviews, and prices into UI-friendly data.
  const primaryImage = product.images?.[0]?.image;
  const imageItems = (product.images || [])
    .map((item) => ({
      id: item.id,
      image: resolvestorageUrl(item.image),
    }))
    .filter((item) => Boolean(item.image));
  const images = imageItems.map((item) => item.image);

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
    image: images[0] || resolvestorageUrl(primaryImage) || "",
    images,
    imageItems,
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
  // Loads the public catalogue with the filters selected by the user.
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
  // Loads one public product for its details page.
  const { data } = await apiClient.get(`/products/${productId}`);
  return normalizeProduct(data);
}

export async function createProductReview(productId, payload) {
  // Posts a signed-in user's rating and review for a product.
  const { data } = await apiClient.post(`/products/${productId}/reviews`, {
    rating: Number(payload.rating),
    comment: payload.comment || "",
  });

  return normalizeProduct(data);
}

export async function createProductReviewReply(productId, reviewId, payload) {
  // Posts a text reply below an existing product review.
  const { data } = await apiClient.post(
    `/products/${productId}/reviews/${reviewId}/replies`,
    {
      comment: payload.comment || "",
    },
  );

  return normalizeProduct(data);
}

export async function getPendingProducts({ limit = 20, offset = 0 } = {}) {
  // Loads products waiting for an administrator's moderation decision.
  const { data } = await apiClient.get("/admin/products/moderation", {
    params: getPaginationParams({ limit, offset }),
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeProduct),
  };
}

export async function getAdminProducts({ limit = 20, offset = 0 } = {}) {
  // Loads all products for the administrator catalogue view.
  const { data } = await apiClient.get("/admin/products", {
    params: getPaginationParams({ limit, offset }),
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeProduct),
  };
}

export async function approveProduct(productId) {
  // Approves a pending product so it can appear in the public catalogue.
  const { data } = await apiClient.patch(
    `/admin/products/moderation/${productId}/approve`,
  );

  return normalizeProduct(data);
}

export async function rejectProduct(productId, reason) {
  // Rejects a product and saves the explanation visible to its seller.
  const { data } = await apiClient.patch(
    `/admin/products/moderation/${productId}/reject`,
    { reason },
  );

  return normalizeProduct(data);
}

export async function blockProduct(productId, reason) {
  // Blocks a published product from further public access.
  const { data } = await apiClient.patch(`/admin/products/${productId}/block`, {
    reason,
  });

  return normalizeProduct(data);
}

export async function deleteAdminProduct(productId, reason) {
  // Deletes a product through the administrator moderation workflow.
  const { data } = await apiClient.delete(`/admin/products/${productId}`, {
    data: { reason },
  });

  return normalizeProduct(data);
}

export async function getMySellerProducts({ limit = 20, offset = 0 } = {}) {
  // Loads the current seller's own product listings.
  const { data } = await apiClient.get("/seller/products", {
    params: getPaginationParams({ limit, offset }),
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeProduct),
  };
}

export async function getMySellerProduct(productId) {
  // Loads one product only if it belongs to the signed-in seller.
  const { data } = await apiClient.get(`/seller/products/${productId}`);
  return normalizeProduct(data);
}

export async function createSellerProduct(payload) {
  // Creates a new seller product draft from the product form values.
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
  // Sends only the changed seller product fields to the backend.
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
  // Uploads an image file and links it to the seller's product.
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await apiClient.post(
    `/seller/products/${productId}/images`,
    formData,
  );

  return normalizeProduct(data);
}

export async function deleteSellerProductImage(productId, imageId) {
  // Removes one image from the seller's product gallery.
  const { data } = await apiClient.delete(
    `/seller/products/${productId}/images/${imageId}`,
  );

  return normalizeProduct(data);
}

export async function submitSellerProduct(productId) {
  // Sends a seller's completed product draft to the moderation queue.
  const { data } = await apiClient.post(`/seller/products/${productId}/submit`);
  return normalizeProduct(data);
}

export async function deleteSellerProduct(productId, reason) {
  // Removes an unpublished seller product and records its reason.
  await apiClient.delete(`/seller/products/${productId}`, {
    data: { reason },
  });
}
