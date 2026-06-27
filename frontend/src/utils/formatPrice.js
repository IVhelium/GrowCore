
export function formatPrice(value) {
    if (value === null || value === undefined) return "" // Avoids showing a price for missing data.

    // Formats a number as a euro price using the German/European number style.
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(value);
}
