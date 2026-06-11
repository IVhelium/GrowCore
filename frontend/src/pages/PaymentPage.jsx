import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, FileText, ShieldCheck } from "lucide-react";
import { getOrders, payOrder } from "../api/orderApi";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import FormField from "../components/common/FormField";
import { useAuth } from "../hooks/useAuth";
import { formatPrice } from "../utils/formatPrice";
import {
  createPaymentDocument,
  downloadPaymentDocument,
} from "../utils/paymentDocument";
import {
  getTrimmedFormData,
  getEmptyFieldMessage,
  hasEmptyRequiredFields,
} from "../utils/formSpaceValidation";

function formatCardNumber(value) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function PaymentPage({ items = [], onPaid }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

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

    if (
      hasEmptyRequiredFields(data, ["cardName", "cardNumber", "expiry", "cvv"])
    ) {
      setError(getEmptyFieldMessage());
      return;
    }

    if (hasEmptyRequiredFields(data, ["deliveryStreet", "deliveryCity", "deliveryZip"])) {
      setError(getEmptyFieldMessage());
      return;
    }

    const deliveryAddress = [
      data.deliveryStreet,
      data.deliveryCity,
      data.deliveryZip,
    ].join(", ");

    const paymentId = `GC-${Date.now()}`;
    const paidAt = new Date().toLocaleString("de-DE");

    const documentHtml = createPaymentDocument({
      paymentId,
      user,
      items: paymentItems,
      total,
      method: "Card simulation",
      paidAt,
      deliveryAddress,
    });

    setIsPaying(true);

    try {
      const updatedOrder = await payOrder(selectedOrder.id, {
        transactionId: paymentId,
        paymentDocument: documentHtml,
        deliveryAddress,
      });

      setReceipt({
        paymentId,
        paidAt,
        documentHtml,
      });
      setOrders((currentOrders) =>
        currentOrders.filter((order) => order.id !== updatedOrder.id),
      );
      setSelectedOrderId("");
      onPaid?.({
        paymentId,
        paidAt,
        total,
      });
    } catch {
      setError("Could not complete payment.");
    } finally {
      setIsPaying(false);
    }
  }

  function handleDownload() {
    if (!receipt) return;

    downloadPaymentDocument(
      receipt.documentHtml,
      `growcore-payment-${receipt.paymentId}.pdf`,
    );
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Payment"
          title="Pay an order"
          text="Choose an unpaid order before entering demo card details."
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
        ) : orders.length === 0 && !receipt ? (
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

              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                  <CreditCard size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Card details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Demo payment. No real money is charged.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Cardholder name"
                  name="cardName"
                  required
                  placeholder="Max Green"
                  wrapperClassName="md:col-span-2"
                />
                <FormField
                  label="Card number"
                  name="cardNumber"
                  required
                  inputMode="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                  placeholder="4242 4242 4242 4242"
                  wrapperClassName="md:col-span-2"
                />
                <FormField
                  label="Expiry"
                  name="expiry"
                  required
                  inputMode="numeric"
                  maxLength={5}
                  value={expiry}
                  onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                  placeholder="12/28"
                />
                <FormField
                  label="CVV"
                  name="cvv"
                  required
                  inputMode="numeric"
                  maxLength={4}
                  value={cvv}
                  onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                />
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
              </div>

              {receipt && (
                <div className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                  Payment simulated successfully. Receipt ID: {receipt.paymentId}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="submit" disabled={!selectedOrder || isPaying}>
                  {isPaying ? "Paying..." : `Pay ${formatPrice(total)}`}
                </Button>

                {receipt && (
                  <Button type="button" style="secondary" onClick={handleDownload}>
                    <FileText size={17} />
                    Download PDF receipt
                  </Button>
                )}
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
