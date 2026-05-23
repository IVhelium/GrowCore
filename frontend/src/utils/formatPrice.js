
export function formatPrice(value) {
    if (value === null || value === undefined) return ""

    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }.format(value));
}