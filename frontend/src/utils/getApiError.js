
export function getApiError(
    error,
    fallback = "Something went wrong"
) {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail.map((item) => item.msg || "Invalid value").join(". ");
    }

    if (error?.code === "ERR_NETWORK") {
        return "Cannot connect to the server"
    }

    return fallback;
}