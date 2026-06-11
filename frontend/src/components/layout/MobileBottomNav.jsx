import { Bell, Heart, Home, Search, ShoppingBag, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "../../api/userApi";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Catalog", href: "/catalog", icon: Search },
  { label: "Cart", href: "/cart", icon: ShoppingBag },
  { label: "Saved", href: "/favorites", icon: Heart },
  { label: "Users", href: "/users", icon: Users },
  { label: "Alerts", href: "/notifications", icon: Bell },
];

export default function MobileBottomNav() {
  const { isAuthenticated } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationCount(0);
      return undefined;
    }

    let isActive = true;

    async function loadCount() {
      try {
        const count = await getUnreadNotificationCount();
        if (isActive) {
          setNotificationCount(count);
        }
      } catch {
        if (isActive) {
          setNotificationCount(0);
        }
      }
    }

    loadCount();
    window.addEventListener("growcore:notifications-updated", loadCount);

    return () => {
      isActive = false;
      window.removeEventListener("growcore:notifications-updated", loadCount);
    };
  }, [isAuthenticated]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-500 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            to={item.href}
            className="relative flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition hover:bg-[#4F8A5B]/10 hover:text-[#4F8A5B]"
          >
            <Icon size={19} />
            {item.href === "/notifications" && notificationCount > 0 && (
              <span className="absolute right-2 top-0 grid h-4 min-w-4 place-items-center rounded bg-red-500 px-1 text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
