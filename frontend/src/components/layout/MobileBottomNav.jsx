import { Bell, Heart, Home, Search, ShoppingBag, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFriendRequestCount, getUnreadNotificationCount } from "../../api/userApi";
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
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      window.setTimeout(() => {
        setNotificationCount(0);
        setFriendRequestCount(0);
      }, 0);
      return undefined;
    }

    let isActive = true;

    async function loadCount() {
      try {
        const [count, requests] = await Promise.all([
          getUnreadNotificationCount(),
          getFriendRequestCount(),
        ]);
        if (isActive) {
          setNotificationCount(count);
          setFriendRequestCount(requests);
        }
      } catch {
        if (isActive) {
          setNotificationCount(0);
          setFriendRequestCount(0);
        }
      }
    }

    loadCount();
    window.addEventListener("growcore:notifications-updated", loadCount);
    window.addEventListener("growcore:friend-requests-updated", loadCount);

    return () => {
      isActive = false;
      window.removeEventListener("growcore:notifications-updated", loadCount);
      window.removeEventListener("growcore:friend-requests-updated", loadCount);
    };
  }, [isAuthenticated]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid min-w-0 grid-cols-6 border-t border-slate-200 bg-white px-1 py-2 text-[10px] font-semibold text-slate-500 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] sm:px-2 sm:text-xs md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            to={item.href}
            className="relative flex min-w-0 flex-col items-center gap-1 overflow-hidden rounded-lg px-0.5 py-1.5 transition hover:bg-[#4F8A5B]/10 hover:text-[#4F8A5B] sm:px-2"
          >
            <Icon size={19} />
            {item.href === "/notifications" && notificationCount > 0 && (
              <span className="absolute right-2 top-0 grid h-4 min-w-4 place-items-center rounded bg-red-500 px-1 text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
            {item.href === "/users" && friendRequestCount > 0 && (
              <span className="absolute right-2 top-0 grid h-4 min-w-4 place-items-center rounded bg-red-500 px-1 text-[10px] font-bold text-white">
                {friendRequestCount}
              </span>
            )}
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
