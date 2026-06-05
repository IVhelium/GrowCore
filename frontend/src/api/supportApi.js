import { apiClient, getPaginationParams } from "./apiClient";

export function normalizeSupportTicket(ticket) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    message: ticket.message,
    response: ticket.response,
    status: ticket.status,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    resolvedAt: ticket.resolved_at,
    user: ticket.user || null,
    assignedSupport: ticket.assigned_support || null,
    raw: ticket,
  };
}

export async function getSupportTickets({ limit = 12, offset = 0, status } = {}) {
  const { data } = await apiClient.get("/support/tickets", {
    params: {
      ...getPaginationParams({ limit, offset }),
      ticket_status: status || undefined,
    },
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeSupportTicket),
  };
}

export async function assignSupportTicket(ticketId) {
  const { data } = await apiClient.patch(`/support/tickets/${ticketId}/assign`);
  return normalizeSupportTicket(data);
}
