import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, MessageSquare, UserCheck } from "lucide-react";
import {
  assignSupportTicket,
  getSupportTickets,
  updateSupportTicket,
} from "../api/supportApi";
import { blockUser } from "../api/userApi";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import PaginationBar from "../components/common/PaginationBar";
import UserMiniCard from "../components/user/UserMiniCard";
import { getApiError } from "../utils/getApiError";
import { formatDateTime } from "../utils/formatDateTime";
import { showToast } from "../utils/showToast";
import { useAuth } from "../hooks/useAuth";

const TICKETS_PAGE_SIZE = 8;

const statusFilters = [
  { label: "Open", value: "open" },
  { label: "In progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const statusFilterValues = statusFilters.map((filter) => filter.value);

function hasRole(user, role) {
  return (user?.roles || []).some((item) => item.role?.role === role || item.role === role);
}

function getSafePage(value) {
  return Math.max(1, Number(value) || 1);
}

function StatusBadge({ status }) {
  const styles = {
    open: "bg-blue-50 text-blue-700",
    in_progress: "bg-indigo-50 text-indigo-700",
    resolved: "bg-green-50 text-green-700",
    closed: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-lg px-3 py-1 text-xs font-bold uppercase ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status?.replace("_", " ") || "unknown"}
    </span>
  );
}

export default function SupportPanelPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [ticketTotal, setTicketTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [responseDrafts, setResponseDrafts] = useState({});
  const { user: currentUser } = useAuth();
  const isAdmin = hasRole(currentUser, "admin");
  const queryStatus = searchParams.get("status") || "open";
  const statusFilter = statusFilterValues.includes(queryStatus)
    ? queryStatus
    : "open";
  const currentPage = getSafePage(searchParams.get("page"));

  const setCurrentPage = useCallback(
    (page) => {
      const safePage = getSafePage(page);
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);

        if (safePage > 1) {
          nextParams.set("page", String(safePage));
        } else {
          nextParams.delete("page");
        }

        if (statusFilter !== "open") {
          nextParams.set("status", statusFilter);
        } else {
          nextParams.delete("status");
        }

        return nextParams;
      });
    },
    [setSearchParams, statusFilter],
  );

  const setStatusFilterQuery = useCallback(
    (nextStatus) => {
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);

        if (nextStatus !== "open") {
          nextParams.set("status", nextStatus);
        } else {
          nextParams.delete("status");
        }

        nextParams.delete("page");
        return nextParams;
      });
    },
    [setSearchParams],
  );

  const loadTickets = useCallback(async (nextStatus, page, search = searchQuery) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const ticketPage = await getSupportTickets({
        status: nextStatus,
        search: search.trim() || undefined,
        limit: TICKETS_PAGE_SIZE,
        offset: (page - 1) * TICKETS_PAGE_SIZE,
      });
      setTickets(ticketPage.items);
      setTicketTotal(ticketPage.total);

      const backendPage = Math.floor((ticketPage.offset || 0) / TICKETS_PAGE_SIZE) + 1;

      if (backendPage !== page) {
        setCurrentPage(backendPage);
      }
    } catch (error) {
      setTickets([]);
      setTicketTotal(0);
      setErrorMessage(getApiError(error, "Could not load support tickets"));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, setCurrentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTickets(statusFilter, currentPage);
  }, [currentPage, loadTickets, searchQuery, statusFilter]);

  const metricText = useMemo(
    () => `${ticketTotal} ${statusFilter.replace("_", " ")} tickets`,
    [statusFilter, ticketTotal],
  );

  async function runTicketAction(key, action, successMessage) {
    setBusyKey(key);
    setErrorMessage("");

    try {
      await action();
      showToast(successMessage, "success");
      await loadTickets(statusFilter, currentPage);
    } catch (error) {
      setErrorMessage(getApiError(error, "Ticket action failed"));
    } finally {
      setBusyKey("");
    }
  }

  function getResponseDraft(ticket) {
    return responseDrafts[ticket.id] ?? ticket.response ?? "";
  }

  function updateResponseDraft(ticketId, value) {
    setResponseDrafts((current) => ({
      ...current,
      [ticketId]: value,
    }));
  }

  function updateTicketWithResponse(ticket, status = ticket.status) {
    const trimmedResponse = getResponseDraft(ticket).trim();

    if (!trimmedResponse) {
      showToast("Response is required");
      return;
    }

    runTicketAction(
      `resolve-${ticket.id}`,
      () =>
        updateSupportTicket(ticket.id, {
          response: trimmedResponse,
          status,
        }),
      status === "resolved" ? "Ticket resolved" : "Ticket updated",
    );
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Support"
          title="Support panel"
          text="Handle only user help requests and support conversations."
        />

        {errorMessage && (
          <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Help requests
              </h2>
              <p className="mt-1 text-sm text-slate-500">{metricText}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setStatusFilterQuery(filter.value);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === filter.value
                      ? "bg-[#4F8A5B] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-6">
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
            placeholder="Search current support queue..."
          />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading && (
            <p className="p-5 text-sm text-slate-500">
              Loading support tickets...
            </p>
          )}

          {!isLoading && tickets.length === 0 && (
            <p className="p-5 text-sm text-slate-500">
              No tickets in this queue.
            </p>
          )}

          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-slate-950">
                        #{ticket.id} {ticket.subject}
                      </h3>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="mt-2 text-xs font-bold uppercase text-slate-400">
                      {ticket.ticketType?.replace("_", " ") || "other"}
                    </p>

                    <div className="mt-2">
                      <UserMiniCard user={ticket.user} />
                    </div>
                    {ticket.assignedSupport && (
                      <div className="mt-2 rounded-lg bg-slate-50 p-2">
                        <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                          Assigned support
                        </p>
                        <UserMiniCard user={ticket.assignedSupport} />
                      </div>
                    )}

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {ticket.message}
                    </p>

                    {ticket.response && (
                      <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        {ticket.response}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {ticket.status === "open" && (
                      <Button
                        size="sm"
                        disabled={busyKey === `assign-${ticket.id}`}
                        onClick={() =>
                          runTicketAction(
                            `assign-${ticket.id}`,
                            () => assignSupportTicket(ticket.id),
                            "Ticket assigned",
                          )
                        }
                      >
                        <UserCheck size={16} />
                        Assign
                      </Button>
                    )}

                    {isAdmin && ticket.user?.public_id && (
                      <Button
                        size="sm"
                        style="danger"
                        disabled={busyKey === `block-user-${ticket.id}`}
                        onClick={() => {
                          const reason = window.prompt(`Reason for blocking ${ticket.user.username}`);
                          const trimmedReason = reason?.trim();

                          if (!trimmedReason) return;

                          if (trimmedReason.length < 10) {
                            showToast("Block reason must be at least 10 characters");
                            return;
                          }

                          runTicketAction(
                            `block-user-${ticket.id}`,
                            () => blockUser(ticket.user.public_id, trimmedReason),
                            "User blocked",
                          );
                        }}
                      >
                        Block user
                      </Button>
                    )}

                    {ticket.status !== "resolved" && ticket.status !== "closed" && (
                      <Button
                        size="sm"
                        style="secondary"
                        disabled={busyKey === `resolve-${ticket.id}`}
                        onClick={() => {
                          setExpandedTicketId(ticket.id);
                          setResponseDrafts((current) => ({
                            ...current,
                            [ticket.id]: current[ticket.id] ?? ticket.response ?? "",
                          }));
                        }}
                      >
                        <CheckCircle2 size={16} />
                        Reply
                      </Button>
                    )}

                    <Button
                      size="sm"
                      style="ghost"
                      onClick={() => {
                        setExpandedTicketId((current) =>
                          current === ticket.id ? null : ticket.id,
                        );
                        setResponseDrafts((current) => ({
                          ...current,
                          [ticket.id]: current[ticket.id] ?? ticket.response ?? "",
                        }));
                      }}
                    >
                      <MessageSquare size={16} />
                      {expandedTicketId === ticket.id ? "Hide" : "View"}
                    </Button>
                  </div>
                </div>

                {expandedTicketId === ticket.id && (
                  <div className="mt-4 grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Created
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDateTime(ticket.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Updated
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDateTime(ticket.updatedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Resolved
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : "Not resolved"}
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Full message
                      </p>
                      <p className="break-anywhere mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {ticket.message}
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <label className="grid gap-2">
                        <span className="text-xs font-bold uppercase text-slate-400">
                          Support response
                        </span>
                        <textarea
                          value={getResponseDraft(ticket)}
                          onChange={(event) =>
                            updateResponseDraft(ticket.id, event.target.value)
                          }
                          rows={5}
                          maxLength={2000}
                          className="break-anywhere resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#4F8A5B]"
                          placeholder="Write a clear answer for the user..."
                        />
                      </label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={busyKey === `resolve-${ticket.id}`}
                          onClick={() =>
                            updateTicketWithResponse(ticket, "in_progress")
                          }
                        >
                          Save response
                        </Button>
                        <Button
                          size="sm"
                          style="secondary"
                          disabled={busyKey === `resolve-${ticket.id}`}
                          onClick={() =>
                            updateTicketWithResponse(ticket, "resolved")
                          }
                        >
                          Mark resolved
                        </Button>
                        <Button
                          size="sm"
                          style="ghost"
                          disabled={busyKey === `resolve-${ticket.id}`}
                          onClick={() =>
                            updateTicketWithResponse(ticket, "closed")
                          }
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>

          {!isLoading && tickets.length > 0 && (
            <div className="px-5 pb-5">
              <PaginationBar
                current={currentPage}
                total={ticketTotal}
                pageSize={TICKETS_PAGE_SIZE}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
