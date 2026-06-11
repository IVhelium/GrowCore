import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import {
  createSupportTicket,
  getMySupportTickets,
} from "../api/supportApi";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import FormField from "../components/common/FormField";
import PageHeader from "../components/common/PageHader";
import PaginationBar from "../components/common/PaginationBar";
import { getApiError } from "../utils/getApiError";
import {
  getEmptyFieldMessage,
  getTrimmedFormData,
  hasEmptyRequiredFields,
} from "../utils/formSpaceValidation";
import { showToast } from "../utils/showToast";

const TICKETS_PAGE_SIZE = 8;
const supportTypes = [
  { value: "account", label: "Account" },
  { value: "order", label: "Order" },
  { value: "payment", label: "Payment" },
  { value: "return_request", label: "Return" },
  { value: "seller", label: "Seller" },
  { value: "technical", label: "Technical" },
  { value: "other", label: "Other" },
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

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [ticketTotal, setTicketTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTickets = useCallback(async (page) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const ticketPage = await getMySupportTickets({
        limit: TICKETS_PAGE_SIZE,
        offset: (page - 1) * TICKETS_PAGE_SIZE,
      });
      setTickets(ticketPage.items);
      setTicketTotal(ticketPage.total);

      if (ticketPage.items.length === 0 && ticketPage.has_previous) {
        setCurrentPage(page - 1);
      }
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not load support tickets"));
      setTickets([]);
      setTicketTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTickets(currentPage);
  }, [currentPage, loadTickets]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = getTrimmedFormData(form);

    if (hasEmptyRequiredFields(payload, ["ticketType", "subject", "message"])) {
      setErrorMessage(getEmptyFieldMessage());
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await createSupportTicket(payload);
      form.reset();
      showToast("Support ticket created", "success");
      setCurrentPage(1);
      await loadTickets(1);
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not create support ticket"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Support"
          title="Help center"
          text="Create a support request and track replies from the GrowCore team."
        />

        {errorMessage && (
          <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              My support requests
            </h2>

            {isLoading ? (
              <p className="mt-5 text-sm text-slate-500">
                Loading support requests...
              </p>
            ) : tickets.length === 0 ? (
              <p className="mt-5 rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
                You have not created support requests yet.
              </p>
            ) : (
              <div className="mt-5 grid gap-4">
                {tickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-bold text-slate-950">
                        #{ticket.id} {ticket.subject}
                      </h3>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="mt-2 text-xs font-bold uppercase text-slate-400">
                      {ticket.ticketType?.replace("_", " ") || "other"}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {ticket.message}
                    </p>

                    {ticket.response && (
                      <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        {ticket.response}
                      </p>
                    )}
                  </article>
                ))}
                <PaginationBar
                  current={currentPage}
                  total={ticketTotal}
                  pageSize={TICKETS_PAGE_SIZE}
                  onChange={setCurrentPage}
                />
              </div>
            )}
          </section>

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24"
          >
            <h2 className="text-xl font-bold text-slate-950">
              New request
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Describe your issue and support will answer in this page.
            </p>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Help type
                </span>
                <select
                  name="ticketType"
                  required
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                  defaultValue="order"
                >
                  {supportTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <FormField
                label="Subject"
                name="subject"
                required
                maxLength={150}
                placeholder="Order or account issue"
              />

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Message
                </span>
                <textarea
                  name="message"
                  required
                  rows={7}
                  maxLength={2000}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                  placeholder="Tell us what happened..."
                />
              </label>
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-5 w-full">
              <Send size={17} />
              Send request
            </Button>
          </form>
        </div>
      </Container>
    </main>
  );
}
