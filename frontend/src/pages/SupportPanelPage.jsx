import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, MessageSquare, UserCheck } from "lucide-react";
import {
  assignSupportTicket,
  getSupportTickets,
  updateSupportTicket,
} from "../api/supportApi";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import PaginationBar from "../components/common/PaginationBar";
import UserMiniCard from "../components/user/UserMiniCard";
import { getApiError } from "../utils/getApiError";
import { showToast } from "../utils/showToast";

const TICKETS_PAGE_SIZE = 8;

const statusFilters = [
  { label: "Open", value: "open" },
  { label: "In progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const statusFilterValues = statusFilters.map((filter) => filter.value);

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

  const loadTickets = useCallback(async (nextStatus, page) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const ticketPage = await getSupportTickets({
        status: nextStatus,
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
  }, [setCurrentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTickets(statusFilter, currentPage);
  }, [currentPage, loadTickets, statusFilter]);

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

  function resolveTicket(ticket) {
    const response = window.prompt("Support response for this ticket");
    const trimmedResponse = response?.trim();

    if (!trimmedResponse) {
      showToast("Response is required to resolve a ticket");
      return;
    }

    runTicketAction(
      `resolve-${ticket.id}`,
      () =>
        updateSupportTicket(ticket.id, {
          response: trimmedResponse,
          status: "resolved",
        }),
      "Ticket resolved",
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

                    {ticket.status !== "resolved" && ticket.status !== "closed" && (
                      <Button
                        size="sm"
                        style="secondary"
                        disabled={busyKey === `resolve-${ticket.id}`}
                        onClick={() => resolveTicket(ticket)}
                      >
                        <CheckCircle2 size={16} />
                        Resolve
                      </Button>
                    )}

                    <Button
                      size="sm"
                      style="ghost"
                      disabled
                    >
                      <MessageSquare size={16} />
                      View
                    </Button>
                  </div>
                </div>
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
