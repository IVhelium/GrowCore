export function showToast(message, type = "info") {
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
