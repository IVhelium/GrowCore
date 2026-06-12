import { apiClient, getPaginationParams } from "./apiClient";

export function normalizeSupportTicket(ticket) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    message: ticket.message,
    response: ticket.response,
    status: ticket.status,
    ticketType: ticket.ticket_type || "other",
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    resolvedAt: ticket.resolved_at,
    user: ticket.user || null,
    assignedSupport: ticket.assigned_support || null,
    raw: ticket,
  };
}

export async function getSupportTickets({ limit = 12, offset = 0, status, search } = {}) {
  const { data } = await apiClient.get("/support/tickets", {
    params: {
      ...getPaginationParams({ limit, offset }),
      ticket_status: status || undefined,
      search: search || undefined,
    },
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeSupportTicket),
  };
}

export async function getMySupportTickets({ limit = 20, offset = 0 } = {}) {
  const { data } = await apiClient.get("/support/tickets/me", {
    params: getPaginationParams({ limit, offset }),
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeSupportTicket),
  };
}

export async function createSupportTicket(payload) {
  const { data } = await apiClient.post("/support/tickets", {
    subject: payload.subject,
    ticket_type: payload.ticketType || payload.ticket_type || "other",
    message: payload.message,
  });

  return normalizeSupportTicket(data);
}

export async function assignSupportTicket(ticketId) {
  const { data } = await apiClient.patch(`/support/tickets/${ticketId}/assign`);
  return normalizeSupportTicket(data);
}

export async function updateSupportTicket(ticketId, payload) {
  const { data } = await apiClient.patch(`/support/tickets/${ticketId}`, {
    response: payload.response || undefined,
    status: payload.status || undefined,
  });

  return normalizeSupportTicket(data);
}
