import { useEffect, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { getNotifications, markNotificationRead } from "../api/userApi";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import PaginationBar from "../components/common/PaginationBar";
import { formatDateTime } from "../utils/formatDateTime";
import { getApiError } from "../utils/getApiError";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function loadNotifications(page = currentPage) {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await getNotifications({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setNotifications(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not load notifications"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  async function handleMarkRead(notification) {
    setBusyId(notification.id);

    try {
      const updatedNotification = await markNotificationRead(notification.id);
      setNotifications((currentItems) =>
        currentItems.map((item) =>
          item.id === updatedNotification.id ? updatedNotification : item,
        ),
      );
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not update notification"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Account"
          title="Notifications"
          text="Important account and moderation updates appear here."
        />

        {errorMessage && (
          <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" text="You are all caught up." />
        ) : (
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                      <Bell size={20} />
                    </span>
                    <div>
                      <h2 className="font-bold text-slate-950">
                        {notification.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(notification.created_at)}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                    </div>
                  </div>

                  {notification.read_at ? (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500">
                      <CheckCircle2 size={16} />
                      Read
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      style="secondary"
                      disabled={busyId === notification.id}
                      onClick={() => handleMarkRead(notification)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <PaginationBar
          current={currentPage}
          total={total}
          pageSize={PAGE_SIZE}
          onChange={setCurrentPage}
        />
      </Container>
    </main>
  );
}
