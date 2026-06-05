import { apiClient } from "./apiClient";

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
