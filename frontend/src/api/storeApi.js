import { apiClient, getPaginationParams } from "./apiClient";
import { normalizeProduct } from "./productApi";

export function normalizeStore(store) {
  return {
    id: store.id,
    name: store.name,
    description: store.description || "",
    createdAt: store.created_at,
    user: store.user || null,
    raw: store,
  };
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
