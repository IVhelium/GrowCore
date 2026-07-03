import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NOTICE_DURATION_MS = 4000;
const MAX_VISIBLE_NOTICES = 3;
const NOTICE_BURST_WINDOW_MS = 900;

export default function Toast() {
  const [notices, setNotices] = useState([]);
  const hideTimers = useRef(new Map());
  const lastNotice = useRef({ id: null, createdAt: 0 });

  useEffect(() => {
    const timers = hideTimers.current;

    function handleApiNotice(event) {
      const id = `${Date.now()}-${Math.random()}`;
      const notice = {
        id,
        message: event?.detail?.message || "Something went wrong. Please try again.",
        type: event?.detail?.type || "error",
      };

      const isSameBurst = Date.now() - lastNotice.current.createdAt < NOTICE_BURST_WINDOW_MS;
      const previousNoticeId = lastNotice.current.id;
      if (isSameBurst && previousNoticeId) {
        window.clearTimeout(timers.get(previousNoticeId));
        timers.delete(previousNoticeId);
      }
      setNotices((current) => {
        const withoutPrevious = isSameBurst
          ? current.filter((item) => item.id !== previousNoticeId)
          : current;
        return [...withoutPrevious.slice(-(MAX_VISIBLE_NOTICES - 1)), notice];
      });
      lastNotice.current = { id, createdAt: Date.now() };
      timers.set(id, window.setTimeout(() => {
        setNotices((current) => current.filter((item) => item.id !== id));
        timers.delete(id);
      }, NOTICE_DURATION_MS));
    }

    window.addEventListener("growcore:api-notice", handleApiNotice);
    window.addEventListener("growcore:rate-limit", handleApiNotice);
    return () => {
      window.removeEventListener("growcore:api-notice", handleApiNotice);
      window.removeEventListener("growcore:rate-limit", handleApiNotice);
      timers.forEach(window.clearTimeout);
      timers.clear();
    };
  }, []);

  function closeNotice(id) {
    window.clearTimeout(hideTimers.current.get(id));
    hideTimers.current.delete(id);
    setNotices((current) => current.filter((item) => item.id !== id));
  }

  if (!notices.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-100 grid gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-full sm:max-w-sm">
      {notices.map((notice) => {
        const isSuccess = notice.type === "success";
        const Icon = isSuccess ? CheckCircle2 : AlertTriangle;
        return (
          <div key={notice.id} className={`pointer-events-auto w-full rounded-lg border px-4 py-3 shadow-lg ${isSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 shrink-0 ${isSuccess ? "text-emerald-600" : "text-amber-600"}`} size={20} />
              <p className="break-anywhere min-w-0 flex-1 text-sm font-semibold leading-5">{notice.message}</p>
              <button type="button" onClick={() => closeNotice(notice.id)} aria-label="Close notification" className="grid h-6 w-6 shrink-0 place-items-center rounded text-current/70 transition hover:bg-white/70"><X size={16} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
