import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, MessageSquare, UserCheck } from "lucide-react";
import {
  assignSupportTicket,
  getSupportTickets,
  updateSupportTicket,
} from "../api/supportApi";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import { getApiError } from "../utils/getApiError";
import { showToast } from "../utils/showToast";

const statusFilters = [
  { label: "Open", value: "open" },
  { label: "In progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

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
  const [tickets, setTickets] = useState([]);
  const [ticketTotal, setTicketTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("open");
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadTickets = useCallback(async (nextStatus) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const ticketPage = await getSupportTickets({ status: nextStatus });
      setTickets(ticketPage.items);
      setTicketTotal(ticketPage.total);
    } catch (error) {
      setTickets([]);
      setTicketTotal(0);
      setErrorMessage(getApiError(error, "Could not load support tickets"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTickets(statusFilter);
  }, [loadTickets, statusFilter]);

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
      await loadTickets(statusFilter);
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
                  onClick={() => setStatusFilter(filter.value)}
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

                    <p className="mt-1 text-sm text-slate-500">
                      User: {ticket.user?.username || "GrowCore user"}
                    </p>

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
        </section>
      </Container>
    </main>
  );
}
