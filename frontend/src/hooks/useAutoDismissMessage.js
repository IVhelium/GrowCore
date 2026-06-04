import { useEffect, useState } from "react";

const DEFAULT_DISMISS_DELAY_MS = 3200;

export function useAutoDismissMessage(
  initialMessage = "",
  delay = DEFAULT_DISMISS_DELAY_MS,
) {
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setMessage("");
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay, message]);

  return [message, setMessage];
}
