import { useEffect, useState } from "react";

const DEFAULT_DISMISS_DELAY_MS = 3200;

export function useAutoDismissMessage(
  initialMessage = "",
  delay = DEFAULT_DISMISS_DELAY_MS,
) {
  // Stores a message and automatically clears it after the chosen delay.
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    if (!message) { // Do not create a timer when there is nothing to dismiss.
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setMessage("");
    }, delay);

    return () => clearTimeout(timeoutId); // Cleans up the timer when the message changes.
  }, [delay, message]);

  return [message, setMessage];
}
