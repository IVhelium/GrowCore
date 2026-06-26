export function formatDateTime(value, options = {}) {
  // Converts an ISO date from the API into a readable date and time.
  if (!value) return ""; // Missing dates should not display "Invalid Date".

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("de-DE", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(date);
}

export function formatDate(value) {
  // Formats a date without time for short interface labels.
  return formatDateTime(value, {
    hour: undefined,
    minute: undefined,
  });
}
