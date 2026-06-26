export function showToast(message, type = "info") {
  // Sends a browser event that the shared Toast component displays.
  if (typeof window === "undefined" || !message) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("growcore:api-notice", {
      detail: {
        message,
        type,
      },
    }),
  );
}
