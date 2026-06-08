import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NOTICE_DURATION_MS = 3200;

export default function Toast() {
  const [notice, setNotice] = useState(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    function handleApiNotice(event) {
      const nextMessage =
        event?.detail?.message ||
        "Something went wrong. Please try again.";
      const nextType = event?.detail?.type || "error";

      setNotice({
        message: nextMessage,
        type: nextType,
      });

      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      hideTimer.current = setTimeout(() => {
        setNotice(null);
        hideTimer.current = null;
      }, NOTICE_DURATION_MS);
    }

    window.addEventListener("growcore:api-notice", handleApiNotice);
    window.addEventListener("growcore:rate-limit", handleApiNotice);

    return () => {
      window.removeEventListener("growcore:api-notice", handleApiNotice);
      window.removeEventListener("growcore:rate-limit", handleApiNotice);

      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  if (!notice) {
    return null;
  }

  const isSuccess = notice.type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;
  const toastClassName = isSuccess
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : "border-amber-200 bg-amber-50 text-amber-900";
  const iconClassName = isSuccess ? "text-emerald-600" : "text-amber-600";

  return (
    <div
      className={`fixed top-4 right-11 z-100 w-[calc(100%-2rem)] max-w-md -translate-x-10 rounded-lg border px-4 py-3 shadow-lg ${toastClassName}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 shrink-0 ${iconClassName}`} size={20} />
        <p className="text-sm font-semibold leading-5">{notice.message}</p>
      </div>
    </div>
  );
}
