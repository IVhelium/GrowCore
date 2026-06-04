import { apiClient, resolvestorageUrl } from "./apiClient";

// Backend category DTO normalization for catalog UI.
function normalizeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    image: resolvestorageUrl(category.image_url),
    imageUrl: resolvestorageUrl(category.image_url),
  };
}

// Backend category catalog request.
export async function getCategories() {
  const { data } = await apiClient.get("/categories", {
    _silent: true,
  });

  return (data || []).map(normalizeCategory);
}
