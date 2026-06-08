import { useState } from "react";
import { CreditCard, FileText, ShieldCheck } from "lucide-react";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
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
} from "../utils/formUtils";

export default function PaymentPage({ items = [], onPaid }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const data = getTrimmedFormData(event.currentTarget);

    if (
      hasEmptyRequiredFields(data, ["cardName", "cardNumber", "expiry", "cvv"])
    ) {
      setError(getEmptyFieldMessage());
      return;
    }

    const paymentId = `GC-${Date.now()}`;
    const paidAt = new Date().toLocaleString("en-US");

    const documentHtml = createPaymentDocument({
      paymentId,
      user,
      items,
      total,
      method: "Card simulation",
      paidAt,
    });

    setReceipt({
      paymentId,
      paidAt,
      documentHtml,
    });

    onPaid?.({
      paymentId,
      paidAt,
      total,
    });
  }

  function handleDownload() {
    if (!receipt) return;

    downloadPaymentDocument(
      receipt.documentHtml,
      `growcore-payment-${receipt.paymentId}.html`,
    );
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Payment"
          title="Payment simulation"
          text="This page simulates a payment and generates a payment document."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
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
                placeholder="4242 4242 4242 4242"
                wrapperClassName="md:col-span-2"
              />

              <FormField
                label="Expiry"
                name="expiry"
                required
                placeholder="12/28"
              />

              <FormField label="CVV" name="cvv" required placeholder="123" />
            </div>

            {error && (
              <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {receipt && (
              <div className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                Payment simulated successfully. Receipt ID: {receipt.paymentId}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="submit">Pay {formatPrice(total)}</Button>

              {receipt && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDownload}
                >
                  <FileText size={17} />
                  Download document
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
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-slate-500">
                    {item.title} × {item.quantity}
                  </span>

                  <span className="font-semibold text-slate-950">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
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
      </Container>
    </main>
  );
}
