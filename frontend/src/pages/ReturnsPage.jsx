import { RotateCcw } from "lucide-react";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import FormField from "../components/common/FormField";
import {
  getTrimmedFormData,
  getEmptyFieldMessage,
  hasEmptyRequiredFields,
} from "../utils/formSpaceValidation";
import { useEffect, useState } from "react";
import { getOrders, requestOrderReturn } from "../api/orderApi";
import { formatPrice } from "../utils/formatPrice";
import { getApiError } from "../utils/getApiError";

export default function ReturnsPage({ onSubmit }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadOrders() {
      try {
        const loadedOrders = await getOrders();
        const returnableOrders = loadedOrders.filter(
          (order) =>
            order.paymentStatus === "paid" &&
            order.returnStatus === "none",
        );

        if (isActive) {
          setOrders(returnableOrders);
        }
      } catch {
        if (isActive) {
          setOrders([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingOrders(false);
        }
      }
    }

    loadOrders();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const data = getTrimmedFormData(event.currentTarget);

    if (hasEmptyRequiredFields(data, ["orderId", "email", "reason"])) {
      setError(getEmptyFieldMessage());
      return;
    }

    try {
      await requestOrderReturn(Number(data.orderId), data.reason);
      onSubmit?.(data);
      event.currentTarget.reset();
      setSuccess("Return request created.");
    } catch (requestError) {
      setError(getApiError(requestError, "Could not create return request"));
    }
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Returns"
          title="Return request"
          text="Create a return request for sensors, irrigation parts or replacement components."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-950">
                Return details
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Fill in the form and support will review your request.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Order
                </span>
                <select
                  name="orderId"
                  required
                  disabled={isLoadingOrders}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                >
                  <option value="">
                    {isLoadingOrders
                      ? "Loading orders..."
                      : orders.length
                        ? "Choose order"
                        : "No paid orders"}
                  </option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      Order #{order.id} - {formatPrice(order.total)}
                    </option>
                  ))}
                </select>
              </label>

              <FormField
                label="Email"
                name="email"
                type="email"
                required
                placeholder="you@growcore.dev"
              />

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Reason
                </span>

                <textarea
                  name="reason"
                  required
                  minLength={10}
                  maxLength={400}
                  rows={6}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                  placeholder="Describe the reason for return..."
                />
              </label>
            </div>

            {error && (
              <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {success && (
              <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </p>
            )}

            <Button type="submit" className="mt-6">
              Create return request
            </Button>
          </form>

          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 grid h-14 w-14 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
              <RotateCcw size={28} />
            </div>

            <h2 className="text-xl font-bold text-slate-950">Return policy</h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Electronic components should be returned in safe packaging.
              Damaged probes, cables or connectors may require additional
              review.
            </p>
          </aside>
        </div>
      </Container>
    </main>
  );
}
