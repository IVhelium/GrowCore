export function compareText(first, second) {
  return String(first || "").localeCompare(String(second || ""), undefined, {
    sensitivity: "base",
  });
}

export function sortAdminItems(items, sortValue, tab) {
  const sorted = [...items];
  const dateValue = (item) => new Date(
    item.createdAt || item.date || item.raw?.created_at || 0,
  ).getTime();
  const nameValue = (item) => item.title || item.fullName || item.username || item.name;

  return sorted.sort((first, second) => {
    if (sortValue === "newest") return dateValue(second) - dateValue(first) || Number(second.id || 0) - Number(first.id || 0);
    if (sortValue === "oldest") return dateValue(first) - dateValue(second) || Number(first.id || 0) - Number(second.id || 0);
    if (sortValue === "name-asc") return compareText(nameValue(first), nameValue(second));
    if (sortValue === "name-desc") return compareText(nameValue(second), nameValue(first));
    if (sortValue === "price-desc") return Number(second.price) - Number(first.price);
    if (sortValue === "price-asc") return Number(first.price) - Number(second.price);
    if (sortValue === "total-desc") return Number(second.total) - Number(first.total);
    if (sortValue === "total-asc") return Number(first.total) - Number(second.total);
    if (sortValue === "status-asc") return compareText(first.status, second.status);
    if (sortValue === "blocked-first") return Number(second.isBlocked) - Number(first.isBlocked) || compareText(nameValue(first), nameValue(second));
    if (sortValue === "active-first") return Number(first.isBlocked) - Number(second.isBlocked) || compareText(nameValue(first), nameValue(second));
    if (sortValue === "visible-first") return Number(second.showInFilters) - Number(first.showInFilters) || compareText(nameValue(first), nameValue(second));
    if (sortValue === "hidden-first") return Number(first.showInFilters) - Number(second.showInFilters) || compareText(nameValue(first), nameValue(second));
    if (sortValue === "position-desc") return Number(second.sortOrder) - Number(first.sortOrder);
    if (sortValue === "position-asc" && tab === "categories") return Number(first.sortOrder) - Number(second.sortOrder);
    return 0;
  });
}

export function formatAdminDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
