
export function getApiError(
    error,
    fallback = "Something went wrong"
) {
    // Converts common API error shapes into one message for forms.
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") { // Uses a direct backend error message.
        return detail;
    }

    if (Array.isArray(detail)) { // Combines validation errors from several fields.
        return detail.map((item) => item.msg || "Invalid value").join(". ");
    }

    if (error?.code === "ERR_NETWORK") { // Reports when the server cannot be reached.
        return "Cannot connect to the server"
    }

    return fallback;
}
