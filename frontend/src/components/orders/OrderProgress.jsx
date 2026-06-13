import { CheckCircle2, Clock, Truck } from "lucide-react";
import { humanizeStatus } from "../../utils/orderStatus";

export default function OrderProgress({ order }) {
  const steps = [
    {
      label: "Order placed",
      active: true,
      done: true,
      icon: CheckCircle2,
    },
    {
      label: "Payment",
      value: humanizeStatus(order.paymentStatus),
      active: order.paymentStatus !== "pending",
      done: order.paymentStatus === "paid",
      icon: CheckCircle2,
    },
    {
      label: "Delivery",
      value: humanizeStatus(order.deliveryStatus),
      active: order.deliveryStatus !== "pending",
      done: order.deliveryStatus === "delivered",
      icon: Truck,
    },
    {
      label: "Return",
      value: humanizeStatus(order.returnStatus),
      active: order.returnStatus !== "none",
      done: order.returnStatus === "approved",
      icon: Clock,
    },
  ];

  return (
    <div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
      {steps.map((step) => {
        const Icon = step.icon;

        return (
          <div
            key={step.label}
            className={`rounded-lg border bg-white p-3 ${
              step.active ? "border-[#4F8A5B]/30" : "border-slate-100"
            }`}
          >
            <div
              className={`mb-2 grid h-8 w-8 place-items-center rounded-lg ${
                step.done
                  ? "bg-[#4F8A5B] text-white"
                  : step.active
                    ? "bg-[#4F8A5B]/10 text-[#4F8A5B]"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              <Icon size={16} />
            </div>
            <p className="text-xs font-bold uppercase text-slate-500">
              {step.label}
            </p>
            {step.value && (
              <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                {step.value}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
