import {
  CreditCard,
  Headphones,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

const serviceLinks = [
  { to: "/delivery", label: "Delivery", icon: Truck },
  { to: "/returns", label: "Returns", icon: RotateCcw },
  { to: "/payment", label: "Payments", icon: CreditCard },
  { to: "/orders", label: "Orders", icon: PackageCheck },
  { to: "/support", label: "Support", icon: Headphones },
  { to: "/seller-request", label: "Sell on GrowCore", icon: Store },
];

export default function TopBar() {
  return (
    <div className="border-b border-[#3F7148]/20 bg-[#315E3A] text-white">
      <div className="mx-auto flex min-h-10 max-w-7xl flex-col gap-2 px-4 py-2 text-xs sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-8">
        <div className="flex min-w-0 items-center justify-center gap-2 text-center font-semibold lg:justify-start lg:text-left">
          <ShieldCheck size={15} className="shrink-0 text-emerald-100" />
          <span className="truncate">
            Secure checkout, moderated sellers, and tracked marketplace orders
          </span>
        </div>

        <nav
          aria-label="Service links"
          className="flex min-w-0 gap-1 overflow-x-auto whitespace-nowrap pb-0.5 [scrollbar-width:none] lg:justify-end [&::-webkit-scrollbar]:hidden"
        >
          {serviceLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-semibold text-emerald-50 transition hover:bg-white/12 hover:text-white"
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
