import { Heart, Home, Search, ShoppingBag, User } from "lucide-react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Catalog", href: "/catalog", icon: Search },
  { label: "Cart", href: "/cart", icon: ShoppingBag },
  { label: "Saved", href: "/favorites", icon: Heart },
  { label: "Profile", href: "/profile", icon: User },
];

export default function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-500 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            to={item.href}
            className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition hover:bg-[#4F8A5B]/10 hover:text-[#4F8A5B]"
          >
            <Icon size={19} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
