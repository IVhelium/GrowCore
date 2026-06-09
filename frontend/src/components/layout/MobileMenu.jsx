import { Drawer } from "antd";
import { Heart, Leaf, LogOut, ShoppingBag, User, Users } from "lucide-react";
import { Link } from "react-router-dom"
import { getCategoryIcon } from "../../utils/categoryIcons";
import UserAvatar from "../user/UserAvatar";


// Mobile drawer menu with account, cart, saved, and category navigation.
export default function MobileMenu({
  open,
  onClose,
  user,
  onLogout,
  cartCount = 0,
  savedCount = 0,
  categories = [],
}) {

  // Mobile drawer navigation.
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      size={320}
      title={
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2 text-xl font-black text-[#4F8A5B]"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#4F8A5B] text-white">
            <Leaf size={20} />
          </span>
          GrowCore
        </Link>
      }
      styles={{ body: { padding: 16 } }}
    >
      <nav className="grid gap-2 border-b border-slate-200 pb-5">
        <Link
          to={user ? "/profile" : "/login"}
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          {user ? <UserAvatar user={user} size="sm" /> : <User size={18} />}
          <span className="truncate">{user?.username || "Sign In"}</span>
        </Link>

        <Link
          to="/cart"
          onClick={onClose}
          className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <span className="flex items-center gap-3">
            <ShoppingBag size={18} /> Cart
          </span>
          <span className="rounded bg-[#4F8A5B] px-2 py-0.5 text-xs text-white">
            {cartCount}
          </span>
        </Link>

        <Link
          to="/favorites"
          onClick={onClose}
          className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <span className="flex items-center gap-3">
            <Heart size={18} /> Saved
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
            {savedCount}
          </span>
        </Link>

        <Link
          to="/users"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Users size={18} /> Find members
        </Link>

        {user && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut size={18}/> Logout
          </button>
        )}
      </nav>

      <div className="pt-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Catalog
        </h3>
        <nav className="grid gap-1">
          {categories.map((category) => {
            // Category icon selection from shared mapping.
            const Icon = getCategoryIcon(category.name);

            return (
            <Link
              key={category.id}
              to={`/catalog?category=${category.id}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-[#4F8A5B]/10 hover:text-[#4F8A5B]"
            >
              <Icon size={17} className="text-slate-400" />
              {category.name}
            </Link>
            );
          })}
        </nav>
      </div>
    </Drawer>
  );
}
