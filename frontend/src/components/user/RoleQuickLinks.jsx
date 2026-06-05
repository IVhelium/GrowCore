import { Link } from "react-router-dom";
import { ShieldCheck, Store, UserCog } from "lucide-react";

function getUserRoles(user) {
  return (
    user?.roles
      ?.map((userRole) => userRole?.role?.role || userRole?.role)
      .map((role) => role?.toLowerCase())
      .filter(Boolean) || []
  );
}

export default function RoleQuickLinks({
  user,
  compact = false,
  className = "",
}) {
  if (!user) {
    return null;
  }

  const roles = getUserRoles(user);
  const isAdmin = roles.includes("admin");
  const isSupport = roles.includes("support");
  const isSeller = roles.includes("seller");
  const links = [];

  if (isAdmin || isSupport) {
    links.push({
      to: "/admin",
      label: isAdmin ? "Admin panel" : "Support panel",
      icon: UserCog,
      style: "bg-slate-950 text-white hover:bg-slate-800",
    });
  }

  if (isSeller) {
    links.push({
      to: "/seller-request",
      label: "Seller status",
      icon: ShieldCheck,
      style: "border border-[#4F8A5B] bg-white text-[#4F8A5B] hover:bg-[#F2F8F3]",
    });
  }

  if (!isAdmin && !isSupport && !isSeller) {
    links.push({
      to: "/seller-request",
      label: "Become a seller",
      icon: Store,
      style: "bg-[#4F8A5B] text-white hover:bg-[#3F7148]",
    });
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <div className={`grid gap-3 ${className}`}>
      {!compact && (
        <div>
          <h3 className="font-bold text-slate-950">Account actions</h3>
          <p className="mt-1 text-sm text-slate-500">
            Quick links for your current role
          </p>
        </div>
      )}

      <div className={compact ? "flex flex-wrap gap-3" : "grid gap-2"}>
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition ${link.style}`}
            >
              <Icon size={17} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
