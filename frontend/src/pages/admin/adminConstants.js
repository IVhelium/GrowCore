export const adminTabs = [
  { id: "moderation", label: "Product moderation" },
  { id: "controls", label: "Product controls" },
  { id: "transactions", label: "Transactions" },
  { id: "sellerRequests", label: "Seller requests" },
  { id: "users", label: "Users" },
  { id: "sellers", label: "Sellers" },
  { id: "categories", label: "Categories" },
  { id: "filterSellers", label: "Filter sellers" },
];

export const ADMIN_PAGE_SIZE = 8;
export const ADMIN_USERS_PAGE_SIZE = 39;
export const paymentStatusOptions = ["", "pending", "paid", "refunded", "failed"];
export const sellerRequestStatusOptions = ["", "pending", "approved", "rejected"];

export const adminSortOptions = {
  moderation: [["newest", "Newest first"], ["oldest", "Oldest first"], ["name-asc", "Name A-Z"], ["price-desc", "Price: high to low"], ["price-asc", "Price: low to high"]],
  controls: [["newest", "Newest first"], ["oldest", "Oldest first"], ["name-asc", "Name A-Z"], ["price-desc", "Price: high to low"], ["price-asc", "Price: low to high"]],
  transactions: [["newest", "Newest first"], ["oldest", "Oldest first"], ["total-desc", "Total: high to low"], ["total-asc", "Total: low to high"]],
  sellerRequests: [["newest", "Newest first"], ["oldest", "Oldest first"], ["name-asc", "Name A-Z"], ["status-asc", "Status A-Z"]],
  users: [["name-asc", "Name A-Z"], ["name-desc", "Name Z-A"], ["blocked-first", "Blocked first"], ["active-first", "Active first"]],
  sellers: [["name-asc", "Name A-Z"], ["name-desc", "Name Z-A"], ["blocked-first", "Blocked first"], ["active-first", "Active first"]],
  categories: [["position-asc", "Position: first to last"], ["position-desc", "Position: last to first"], ["name-asc", "Name A-Z"]],
  filterSellers: [["name-asc", "Name A-Z"], ["name-desc", "Name Z-A"], ["visible-first", "Visible first"], ["hidden-first", "Hidden first"]],
};
