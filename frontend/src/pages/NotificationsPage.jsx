import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, Trash2 } from "lucide-react";
import {
  deleteAllNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/userApi";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import PaginationBar from "../components/common/PaginationBar";
import { formatDateTime } from "../utils/formatDateTime";
import { getApiError } from "../utils/getApiError";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef([]);
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
      notificationsRef.current = data.items || [];
      setNotifications(notificationsRef.current);
      setTotal(data.total || 0);
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not load notifications"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    function handleNotificationReceived(event) {
      const notification = event.detail;

      if (!notification?.id) {
        return;
      }

      const exists = notificationsRef.current.some((item) => item.id === notification.id);
      notificationsRef.current = exists
        ? notificationsRef.current.map((item) => item.id === notification.id ? notification : item)
        : [notification, ...notificationsRef.current].slice(0, PAGE_SIZE);
      setNotifications(notificationsRef.current);
      if (!exists) setTotal((count) => count + 1);
    }

    window.addEventListener(
      "growcore:notification-received",
      handleNotificationReceived,
    );

    return () => {
      window.removeEventListener(
        "growcore:notification-received",
        handleNotificationReceived,
      );
    };
  }, []);

  async function handleMarkRead(notification) {
    setBusyId(notification.id);

    try {
      const updatedNotification = await markNotificationRead(notification.id);
      setNotifications((currentItems) => {
        const nextItems = currentItems.map((item) =>
          item.id === updatedNotification.id ? updatedNotification : item,
        );
        notificationsRef.current = nextItems;
        return nextItems;
      });
      window.dispatchEvent(new Event("growcore:notifications-updated"));
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not update notification"));
    } finally {
      setBusyId(null);
    }
  }

  async function openNotification(notification) {
    if (!notification.read_at) await handleMarkRead(notification);
    if (notification.link_url?.startsWith("/")) navigate(notification.link_url);
  }

  async function handleMarkAllRead() {
    setBusyId("all");

    try {
      await markAllNotificationsRead();
      setNotifications((currentItems) => {
        const nextItems = currentItems.map((item) => ({
          ...item,
          read_at: item.read_at || new Date().toISOString(),
        }));
        notificationsRef.current = nextItems;
        return nextItems;
      });
      window.dispatchEvent(new Event("growcore:notifications-updated"));
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not update notifications"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteAll() {
    if (notifications.length === 0) return;

    setBusyId("delete-all");

    try {
      await deleteAllNotifications();
      notificationsRef.current = [];
      setNotifications([]);
      setTotal(0);
      setCurrentPage(1);
      window.dispatchEvent(new Event("growcore:notifications-updated"));
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not delete notifications"));
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
          action={
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                style="secondary"
                disabled={busyId === "all" || notifications.every((item) => item.read_at)}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </Button>
              <Button
                type="button"
                style="danger"
                disabled={busyId === "delete-all" || notifications.length === 0}
                onClick={handleDeleteAll}
              >
                <Trash2 size={17} />
                Delete all
              </Button>
            </div>
          }
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
                className={`rounded-xl border p-5 shadow-sm ${
                  notification.read_at
                    ? "border-slate-200 bg-white opacity-75"
                    : "border-[#4F8A5B]/30 bg-[#4F8A5B]/5"
                }`}
              >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                      <Bell size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="break-anywhere font-bold text-slate-950">
                        {notification.title}
                        {notification.occurrence_count > 1 && (
                          <span className="ml-2 rounded-full bg-[#4F8A5B] px-2 py-0.5 text-xs text-white">×{notification.occurrence_count}</span>
                        )}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(notification.created_at)}
                      </p>
                      <p className="break-anywhere mt-3 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                  {notification.link_url && (
                    <Button type="button" size="sm" onClick={() => openNotification(notification)}>Open</Button>
                  )}
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
