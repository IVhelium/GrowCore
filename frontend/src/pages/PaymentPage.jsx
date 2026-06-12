import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, ShieldCheck } from "lucide-react";
import { createStripeCheckout, getOrders } from "../api/orderApi";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import FormField from "../components/common/FormField";
import { formatPrice } from "../utils/formatPrice";
import {
  getTrimmedFormData,
  getEmptyFieldMessage,
  hasEmptyRequiredFields,
} from "../utils/formSpaceValidation";

const PAYMENT_METHODS = [
  {
    id: "stripe",
    label: "Stripe",
    note: "Secure Stripe checkout",
  },
];

export default function PaymentPage({ items = [], onPaid }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [deliveryCountry, setDeliveryCountry] = useState("Portugal");

  useEffect(() => {
    let isActive = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");

      try {
        const loadedOrders = await getOrders();
        const pendingOrders = loadedOrders.filter(
          (order) => order.paymentStatus === "pending",
        );

        if (isActive) {
          setOrders(pendingOrders);
          setSelectedOrderId(pendingOrders[0]?.id ? String(pendingOrders[0].id) : "");
        }
      } catch {
        if (isActive) {
          setError("Could not load orders for payment.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => String(order.id) === selectedOrderId) || null,
    [orders, selectedOrderId],
  );
  const paymentItems = selectedOrder?.items || items;
  const total = selectedOrder
    ? selectedOrder.total
    : items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!selectedOrder) {
      setError("Choose an order before payment.");
      return;
    }

    const data = getTrimmedFormData(event.currentTarget);

    const requiredFields = ["deliveryStreet", "deliveryCity", "deliveryZip", "deliveryCountry"];

    if (deliveryCountry === "Portugal") {
      requiredFields.push("customerNif");
    }

    if (hasEmptyRequiredFields(data, requiredFields)) {
      setError(getEmptyFieldMessage());
      return;
    }

    if (deliveryCountry === "Portugal" && !/^\d{9}$/.test(data.customerNif || "")) {
      setError("Enter a valid 9 digit Portuguese NIF.");
      return;
    }

    const deliveryAddress = [
      data.deliveryStreet,
      data.deliveryCity,
      data.deliveryZip,
      data.deliveryCountry,
    ].join(", ");

    setIsPaying(true);

    try {
      const checkout = await createStripeCheckout(selectedOrder.id, {
        deliveryAddress,
        customerNif: data.customerNif,
      });

      await onPaid?.();
      window.location.assign(checkout.url);
    } catch {
      setError("Could not complete payment.");
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Payment"
          title="Pay an order"
          text="Choose an unpaid order, enter delivery details, then continue to Stripe Checkout."
        />

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders awaiting payment"
            text="Create an order first, then unpaid orders will appear here."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="mb-6">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Order to pay
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(event) => setSelectedOrderId(event.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4F8A5B]"
                >
                  <option value="">Choose order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      Order #{order.id} - {formatPrice(order.total)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-bold text-slate-700">
                  Payment method
                </label>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      className="rounded-lg border border-[#4F8A5B] bg-[#4F8A5B]/10 p-4 text-left"
                    >
                      <span className="block text-sm font-bold text-slate-950">
                        {method.label}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {method.note}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                  <CreditCard size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Payment details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Stripe handles the card details on its secure checkout page.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500 md:col-span-2">
                  You will be redirected to Stripe Checkout after submitting.
                </p>
                <FormField
                  label="Street address"
                  name="deliveryStreet"
                  required
                  placeholder="221B Garden Street"
                  wrapperClassName="md:col-span-2"
                />
                <FormField
                  label="City"
                  name="deliveryCity"
                  required
                  placeholder="Evora"
                />
                <FormField
                  label="ZIP / postal code"
                  name="deliveryZip"
                  required
                  placeholder="7005-469"
                />
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Country / region
                  </label>
                  <select
                    name="deliveryCountry"
                    required
                    value={deliveryCountry}
                    onChange={(event) => setDeliveryCountry(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4F8A5B]"
                  >
                    <option value="Portugal">Portugal</option>
                    <option value="Spain">Spain</option>
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {deliveryCountry === "Portugal" && (
                  <FormField
                    label="NIF"
                    name="customerNif"
                    required
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="123456789"
                  />
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="submit" disabled={!selectedOrder || isPaying}>
                  {isPaying ? "Paying..." : `Pay with Stripe ${formatPrice(total)}`}
                </Button>
              </div>
            </form>

            <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <ShieldCheck className="text-[#4F8A5B]" size={22} />
                <h2 className="text-xl font-bold text-slate-950">
                  Order summary
                </h2>
              </div>

              <div className="grid gap-3">
                {paymentItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/product/${item.productId}`}
                    className="flex justify-between gap-3 text-sm transition hover:text-[#4F8A5B]"
                  >
                    <span className="text-slate-500">
                      {item.title} x {item.quantity}
                    </span>
                    <span className="font-semibold text-slate-950">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                {selectedOrder?.companyFeeTotal > 0 && (
                  <div className="mb-3 flex justify-between text-sm text-slate-500">
                    <span>Company commission</span>
                    <span>{formatPrice(selectedOrder.companyFeeTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </Container>
    </main>
  );
}
