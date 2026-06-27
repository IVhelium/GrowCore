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
      <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-center px-3 py-1.5 text-xs sm:px-6 md:justify-between lg:px-8">
        <div className="hidden min-w-0 items-center gap-2 text-center font-semibold md:flex lg:text-left">
          <ShieldCheck size={15} className="shrink-0 text-emerald-100" />
          <span className="truncate">
            Secure checkout, moderated sellers, and tracked marketplace orders
          </span>
        </div>

        <nav
          aria-label="Service links"
          className="flex w-full min-w-0 items-center justify-between gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] sm:w-auto sm:justify-start md:justify-end [&::-webkit-scrollbar]:hidden"
        >
          {serviceLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              aria-label={label}
              title={label}
              className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 font-semibold text-emerald-50 transition hover:bg-white/12 hover:text-white sm:py-1.5"
            >
              <Icon size={15} />
              <span className="sr-only sm:not-sr-only">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
