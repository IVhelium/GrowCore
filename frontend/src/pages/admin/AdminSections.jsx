import { createElement } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Pencil, Trash2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import ImageWithFallback from "../../components/common/ImageWithFallback";
import PaginationBar from "../../components/common/PaginationBar";
import UserAvatar from "../../components/user/UserAvatar";
import { categoryIconOptions, getCategoryIcon } from "../../utils/categoryIcons";
import { formatPrice } from "../../utils/formatPrice";
import { approveOrderReturn, rejectOrderReturn } from "../../api/orderApi";
import { ADMIN_PAGE_SIZE, ADMIN_USERS_PAGE_SIZE, paymentStatusOptions } from "./adminConstants";
import { formatAdminDateTime } from "./adminUtils";
import { StatusBadge } from "./AdminShared";

export function UsersSection({
  activeTab,
  users,
  page,
  total,
  busyKey,
  runAction,
  getAdminReason,
  onBlockUser,
  onUnblockUser,
  onPageChange,
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "users" ? "" : "hidden"}`}
    >
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-bold text-slate-950">Users</h2>
        <p className="mt-1 text-sm text-slate-500">
          Open user profiles and use admin actions from the profile page
        </p>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
        {users.length === 0 && (
          <p className="text-sm text-slate-500">No users loaded.</p>
        )}

        {users.map((user) => (
          <UserAccessCard
            key={user.public_id}
            item={user}
            busyKey={busyKey}
            busyPrefix="user"
            runAction={runAction}
            getAdminReason={getAdminReason}
            onBlock={onBlockUser}
            onUnblock={onUnblockUser}
            blockedMessage="User blocked"
            unblockedMessage="User unblocked"
          />
        ))}
      </div>

      <div className="px-5 pb-5">
        <PaginationBar
          current={page}
          total={total}
          pageSize={ADMIN_USERS_PAGE_SIZE}
          onChange={onPageChange}
        />
      </div>
    </section>
  );
}

export function SellersSection({
  activeTab,
  sellers,
  page,
  total,
  busyKey,
  runAction,
  getAdminReason,
  onBlockUser,
  onUnblockUser,
  onPageChange,
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "sellers" ? "" : "hidden"}`}
    >
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-bold text-slate-950">Sellers</h2>
        <p className="mt-1 text-sm text-slate-500">
          Browse seller accounts and manage their access
        </p>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
        {sellers.length === 0 && (
          <p className="text-sm text-slate-500">No sellers loaded.</p>
        )}

        {sellers.map((seller) => (
          <UserAccessCard
            key={seller.public_id}
            item={seller}
            busyKey={busyKey}
            busyPrefix="seller"
            runAction={runAction}
            getAdminReason={getAdminReason}
            onBlock={onBlockUser}
            onUnblock={onUnblockUser}
            blockedMessage="Seller blocked"
            unblockedMessage="Seller unblocked"
          />
        ))}
      </div>

      <div className="px-5 pb-5">
        <PaginationBar
          current={page}
          total={total}
          pageSize={ADMIN_USERS_PAGE_SIZE}
          onChange={onPageChange}
        />
      </div>
    </section>
  );
}

function UserAccessCard({
  item,
  busyKey,
  busyPrefix,
  runAction,
  getAdminReason,
  onBlock,
  onUnblock,
  blockedMessage,
  unblockedMessage,
}) {
  const actionKey = `${busyPrefix}-${item.public_id}`;

  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <Link
        to={`/users/${encodeURIComponent(item.public_id)}`}
        className="flex min-w-0 items-center gap-3 transition hover:text-[#4F8A5B]"
      >
        <UserAvatar user={item} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950">
            {item.username}
          </p>
          <p className="truncate text-xs text-slate-400">{item.public_id}</p>
          {item.isBlocked && (
            <p className="mt-2 w-fit rounded-lg bg-red-50 px-2 py-1 text-xs font-bold uppercase text-red-600">
              blocked
            </p>
          )}
        </div>
      </Link>
      <div className="mt-4 grid sm:block">
        {item.isBlocked ? (
          <Button
            type="button"
            size="sm"
            style="secondary"
            disabled={busyKey === actionKey}
            onClick={() =>
              runAction(actionKey, () => onUnblock(item.public_id), unblockedMessage)
            }
          >
            Unblock
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            style="danger"
            disabled={busyKey === actionKey}
            onClick={async () => {
              const reason = await getAdminReason("blocking", item.username);
              if (!reason) return;
              runAction(actionKey, () => onBlock(item.public_id, reason), blockedMessage);
            }}
          >
            Block
          </Button>
        )}
      </div>
    </article>
  );
}

export function TransactionsSection({
  activeTab,
  transactions,
  page,
  total,
  statusFilter,
  busyKey,
  runAction,
  getAdminReason,
  onStatusFilterChange,
  onPageChange,
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "transactions" ? "" : "hidden"}`}
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Transactions</h2>
          <p className="mt-1 text-sm text-slate-500">
            All orders by payment, delivery and return status
          </p>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Payment status
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-[#4F8A5B]"
          >
            {paymentStatusOptions.map((status) => (
              <option key={status || "all"} value={status}>
                {status ? status.replace("_", " ") : "All statuses"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="divide-y divide-slate-100">
        {transactions.length === 0 && (
          <p className="p-5 text-sm text-slate-500">No transactions loaded.</p>
        )}

        {transactions.map((transaction) => (
          <article key={transaction.id} className="min-w-0 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-bold text-slate-950">
                    Order #{transaction.id}
                  </h3>
                  <StatusBadge status={transaction.paymentStatus} />
                  <StatusBadge status={transaction.deliveryStatus} />
                  <StatusBadge status={transaction.returnStatus} />
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {formatPrice(transaction.total)} ·{" "}
                  {formatAdminDateTime(transaction.date)}
                </p>
                <p className="break-anywhere mt-2 text-sm text-slate-600">
                  User: {transaction.userId || "-"} · Method:{" "}
                  {transaction.paymentMethod || "-"} · Transaction:{" "}
                  {transaction.transactionId || "-"}
                </p>
                <p className="break-anywhere mt-2 text-sm text-slate-600">
                  NIF: {transaction.customerNif || "-"} · Tracking:{" "}
                  {transaction.trackingNumber || "-"}
                </p>

                <ReturnStatusRow
                  transaction={transaction}
                  busyKey={busyKey}
                  runAction={runAction}
                  getAdminReason={getAdminReason}
                />

                <details className="group mt-4 rounded-lg border border-slate-200 bg-slate-50">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-700">
                    <span>Products ({transaction.items.length})</span>
                    <ChevronDown
                      size={17}
                      className="transition group-open:rotate-180"
                    />
                  </summary>
                  <div className="grid gap-2 border-t border-slate-200 p-3 sm:grid-cols-2 xl:grid-cols-3">
                    {transaction.items.map((item) => (
                      <Link
                        key={item.id}
                        to={item.productId ? `/product/${item.productId}` : "#"}
                        className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2 transition hover:border-[#4F8A5B]/40"
                      >
                        <ImageWithFallback
                          src={item.image}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-md object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-700">
                            {item.title}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.quantity} x {formatPrice(item.price)}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </details>
              </div>

              <div className="grid gap-2 text-left lg:text-right">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Platform fee
                </p>
                <p className="font-bold text-slate-950">
                  {formatPrice(transaction.companyFeeTotal)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="px-5 pb-5">
        <PaginationBar
          current={page}
          total={total}
          pageSize={ADMIN_PAGE_SIZE}
          onChange={onPageChange}
        />
      </div>
    </section>
  );
}

function ReturnStatusRow({ transaction, busyKey, runAction, getAdminReason }) {
  if (transaction.returnStatus === "none") return null;

  return (
    <div className="mt-3 flex min-w-0 max-w-full flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
      <span className="shrink-0 font-bold text-slate-800">Return:</span>
      <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-bold uppercase text-slate-500">
        {transaction.returnStatus}
      </span>
      <span
        className="min-w-0 flex-1 truncate"
        title={transaction.returnReason || "No reason provided"}
      >
        {transaction.returnReason || "No reason provided"}
      </span>
      {transaction.returnStatus === "requested" && (
        <span className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="min-h-9 px-3 py-1"
            disabled={busyKey === `return-${transaction.id}`}
            onClick={() =>
              runAction(
                `return-${transaction.id}`,
                () => approveOrderReturn(transaction.id),
                "Return refunded",
              )
            }
          >
            <CheckCircle2 size={15} />
            Refund
          </Button>
          <Button
            type="button"
            size="sm"
            style="danger"
            className="min-h-9 px-3 py-1"
            disabled={busyKey === `return-${transaction.id}`}
            onClick={async () => {
              const reason = await getAdminReason(
                "rejecting return for",
                `order #${transaction.id}`,
              );
              if (!reason) return;

              runAction(
                `return-${transaction.id}`,
                () => rejectOrderReturn(transaction.id, reason),
                "Return rejected",
              );
            }}
          >
            <XCircle size={15} />
            Reject
          </Button>
        </span>
      )}
    </div>
  );
}

export function CategoriesSection({
  activeTab,
  categoryName,
  categoryIconName,
  categories,
  visibleCategories,
  editingCategoryId,
  busyKey,
  onCategoryNameChange,
  onCategoryIconNameChange,
  onCategoriesChange,
  onEditingCategoryChange,
  onSubmit,
  onMove,
  onSave,
  onRemove,
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "categories" ? "" : "hidden"}`}
    >
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-bold text-slate-950">Categories</h2>
        <p className="mt-1 text-sm text-slate-500">
          Create, order and maintain catalog categories. Editing and deletion
          always require the secret.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem_auto] lg:items-end"
      >
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Category name
          </span>
          <input
            value={categoryName}
            onChange={(event) => onCategoryNameChange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
            placeholder="Hydroponics"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Lucide icon
          </span>
          <select
            value={categoryIconName}
            onChange={(event) => onCategoryIconNameChange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
          >
            {categoryIconOptions.map(([name]) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Preview</span>
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
            {createElement(getCategoryIcon({ iconName: categoryIconName }), {
              size: 24,
            })}
          </span>
        </div>

        <Button type="submit" disabled={busyKey === "category-create"}>
          Add category
        </Button>
      </form>

      <div className="divide-y divide-slate-100 border-t border-slate-200">
        {visibleCategories.map((category) => {
          const editing = editingCategoryId === category.id;
          return (
            <article
              key={category.id}
              className="grid min-w-0 gap-3 p-4 sm:p-5 md:grid-cols-[3rem_minmax(0,1fr)] md:items-center xl:grid-cols-[3rem_minmax(0,1fr)_12rem_auto]"
            >
              <span className="text-[#4F8A5B]">
                {createElement(getCategoryIcon(category), { size: 22 })}
              </span>
              <input
                disabled={!editing}
                value={category.name}
                onChange={(event) =>
                  onCategoriesChange((items) =>
                    items.map((item) =>
                      item.id === category.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  )
                }
                className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:border-transparent disabled:bg-transparent"
              />
              <select
                disabled={!editing}
                value={category.iconName}
                onChange={(event) =>
                  onCategoriesChange((items) =>
                    items.map((item) =>
                      item.id === category.id
                        ? { ...item, iconName: event.target.value }
                        : item,
                    ),
                  )
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:border-transparent disabled:bg-transparent md:col-start-2 xl:col-start-auto"
              >
                {categoryIconOptions.map(([name]) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
                <button
                  type="button"
                  disabled={
                    categories[0]?.id === category.id ||
                    busyKey === `category-move-${category.id}`
                  }
                  onClick={() => onMove(category, -1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                  aria-label="Move category up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  disabled={
                    categories.at(-1)?.id === category.id ||
                    busyKey === `category-move-${category.id}`
                  }
                  onClick={() => onMove(category, 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                  aria-label="Move category down"
                >
                  <ChevronDown size={16} />
                </button>
                {editing ? (
                  <Button size="sm" onClick={() => onSave(category)}>
                    Save
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    style="secondary"
                    onClick={() => onEditingCategoryChange(category.id)}
                  >
                    <Pencil size={15} /> Edit
                  </Button>
                )}
                <Button size="sm" style="danger" onClick={() => onRemove(category)}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function FilterSellersSection({
  activeTab,
  stores,
  busyKey,
  onToggleStore,
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "filterSellers" ? "" : "hidden"}`}
    >
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-bold text-slate-950">
          Seller filter options
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Selected stores appear by name; every other store remains available
          through "Other".
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {stores.map((store) => (
          <label
            key={store.id}
            className="flex cursor-pointer items-center justify-between gap-4 p-5"
          >
            <span className="font-semibold text-slate-700">{store.name}</span>
            <input
              type="checkbox"
              checked={store.showInFilters}
              disabled={busyKey === `filter-store-${store.id}`}
              onChange={() => onToggleStore(store)}
              className="h-5 w-5 accent-[#4F8A5B]"
            />
          </label>
        ))}
        {!stores.length && (
          <p className="p-5 text-sm text-slate-500">No stores found.</p>
        )}
      </div>
    </section>
  );
}
