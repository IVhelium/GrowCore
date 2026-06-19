import { apiClient, getPaginationParams } from "./apiClient";
import { normalizeProduct } from "./productApi";

export function normalizeStore(store) {
  return {
    id: store.id,
    name: store.name,
    description: store.description || "",
    createdAt: store.created_at,
    user: store.user || null,
    showInFilters: Boolean(store.show_in_filters),
    raw: store,
  };
}

export async function getStoreFilterOptions() {
  const { data } = await apiClient.get("/stores/filter-options", { _silent: true });
  return (data || []).map(normalizeStore);
}

export async function getAdminStoreFilterOptions() {
  const { data } = await apiClient.get("/stores/admin/filter-options");
  return (data || []).map(normalizeStore);
}

export async function updateAdminStoreFilterOption(storeId, showInFilters) {
  const { data } = await apiClient.patch(`/stores/admin/filter-options/${storeId}`, {
    show_in_filters: showInFilters,
  });
  return normalizeStore(data);
}

export async function getMyStore() {
  const { data } = await apiClient.get("/stores/me");
  return normalizeStore(data);
}

export async function updateMyStore(payload) {
  const { data } = await apiClient.patch("/stores/me", {
    name: payload.name,
    description: payload.description || null,
  });

  return normalizeStore(data);
}

export async function getPublicUserStore(publicId) {
  const { data } = await apiClient.get(`/stores/user/${encodeURIComponent(publicId)}`, {
    _silent: true,
  });
  return normalizeStore(data);
}

export async function getPublicUserStoreProducts(publicId, { limit = 6, offset = 0 } = {}) {
  const { data } = await apiClient.get(
    `/stores/user/${encodeURIComponent(publicId)}/products`,
    {
      params: getPaginationParams({ limit, offset }),
      _silent: true,
    },
  );

  return {
    ...data,
    items: (data.items || []).map(normalizeProduct),
  };
}
