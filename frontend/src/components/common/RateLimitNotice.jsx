import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NOTICE_DURATION_MS = 4200;

export default function RateLimitNotice() {
  const [message, setMessage] = useState("");
  const hideTimer = useRef(null);

  useEffect(() => {
    function handleApiNotice(event) {
      const nextMessage =
        event?.detail?.message ||
        "Too many requests. Please wait a moment and try again.";

      setMessage(nextMessage);

      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      hideTimer.current = setTimeout(() => {
        setMessage("");
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

  if (!message) {
    return null;
  }

  return (
    <div className="fixed left-1/2 top-4 z-100 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
        <p className="text-sm font-semibold leading-5">{message}</p>
      </div>
    </div>
  );
}
