import { apiClient, resolvestorageUrl } from "./apiClient";

// Backend category DTO normalization for catalog UI.
function normalizeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    image: resolvestorageUrl(category.image_url),
    imageUrl: resolvestorageUrl(category.image_url),
    iconName: category.icon_name || "SlidersHorizontal",
    sortOrder: category.sort_order || 0,
  };
}

// Backend category catalog request.
export async function getCategories() {
  const { data } = await apiClient.get("/categories", {
    _silent: true,
  });

  return (data || []).map(normalizeCategory);
}

export async function createCategory(payload, secret) {
  const { data } = await apiClient.post("/admin/categories", {
    name: payload.name,
    icon_name: payload.iconName,
    sort_order: Number(payload.sortOrder || 0),
  }, { headers: { "X-Category-Secret": secret } });

  return normalizeCategory(data);
}

export async function updateCategory(categoryId, payload, secret) {
  const { data } = await apiClient.patch(`/admin/categories/${categoryId}`, {
    name: payload.name,
    icon_name: payload.iconName,
    sort_order: Number(payload.sortOrder || 0),
  }, { headers: { "X-Category-Secret": secret } });
  return normalizeCategory(data);
}

export async function deleteCategory(categoryId, secret) {
  await apiClient.delete(`/admin/categories/${categoryId}`, { headers: { "X-Category-Secret": secret } });
}
