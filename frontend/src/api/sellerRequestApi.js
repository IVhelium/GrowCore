import { API_URL, apiClient, getPaginationParams } from "./apiClient";

export function normalizeSellerRequest(request) {
  return {
    id: request.id,
    passportId: request.passport_id,
    fullName: request.full_name,
    phoneNumber: request.phone_number,
    country: request.country,
    message: request.message,
    documentName: request.document_name,
    documentContentType: request.document_content_type,
    status: request.status,
    rejectionReason: request.rejection_reason,
    createdAt: request.created_at,
    reviewedAt: request.reviewed_at,
    user: request.user || null,
    raw: request,
  };
}

function toSellerRequestPayload(payload) {
  const formData = new FormData();

  formData.append("passport_id", payload.passportId);
  formData.append("full_name", payload.fullName);
  formData.append("phone_number", payload.phoneNumber);
  formData.append("country", payload.country);
  formData.append("message", payload.message);
  formData.append("document", payload.document);

  return formData;
}

export async function createSellerRequest(payload) {
  const { data } = await apiClient.post(
    "/seller-requests",
    toSellerRequestPayload(payload),
  );

  return normalizeSellerRequest(data);
}

export async function getMySellerRequest() {
  const { data } = await apiClient.get("/seller-requests/me", {
    _silent: true,
  });

  return normalizeSellerRequest(data);
}

export async function resubmitSellerRequest(payload) {
  const { data } = await apiClient.patch(
    "/seller-requests/me/resubmit",
    toSellerRequestPayload(payload),
  );

  return normalizeSellerRequest(data);
}

export async function getSellerRequests({
  limit = 20,
  offset = 0,
  status,
} = {}) {
  const { data } = await apiClient.get("/admin/seller-requests", {
    params: {
      ...getPaginationParams({ limit, offset }),
      request_status: status || undefined,
    },
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeSellerRequest),
  };
}

export async function approveSellerRequest(requestId) {
  const { data } = await apiClient.patch(
    `/admin/seller-requests/${requestId}/approve`,
  );

  return normalizeSellerRequest(data);
}

export async function rejectSellerRequest(requestId, reason) {
  const { data } = await apiClient.patch(
    `/admin/seller-requests/${requestId}/reject`,
    { reason },
  );

  return normalizeSellerRequest(data);
}

export function getSellerRequestDocumentUrl(requestId) {
  return `${API_URL}/admin/seller-requests/${requestId}/document`;
}
