import { Menu, Heart, User, ShoppingBag, Leaf, X } from "lucide-react";
import { Popover } from "antd";
import { Link } from "react-router-dom";
import { useState } from "react";
import Container from "../common/Container";
import CatalogPopover from "../catalog/CatalogPopover";
import SearchBar from "../search/SearchBar";
import MobileMenu from "./MobileMenu";

export default function Header({
  user,
  cartCount = 0,
  savedCount = 0,
  onSearch,
  onLogout,
}) {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {isCatalogOpen && (
        <div
          className="fixed inset-0 x-998 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setIsCatalogOpen(false)}
        />
      )}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-md">
        <Container className="py-3 lg:py-4">
          {/* Mobile/tablet header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <button
                type="submit"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open Menu"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
              >
                <Menu size={22} />
              </button>

              <Link
                to="/"
                className="flex min-w-0 items-center gap-2 text-xl font-black tracking-tight text-[#4F8A5B]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#4F8A5B] text-white">
                  <Leaf size={22} />
                </span>
                <span className="truncate">GrowCore</span>
              </Link>

              <Link
                to="/cart"
                aria-label="Cart"
                className="relative grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded bg-[#4F8A5B] px-1 text-[11px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            <SearchBar
              className="mt-3 w-full bg-slate-50"
              placeholder="Search sensors, valves, pumps..."
              onSearch={onSearch}
            />
          </div>

          {/* Desktop header */}
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <Link
              to="/"
              className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#4F8A5B]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#4F8A5B] text-white">
                <Leaf size={22} />
              </span>
              GrowCore
            </Link>

            <Popover
              trigger="click"
              open={isCatalogOpen}
              onOpenChange={setIsCatalogOpen}
              placement="bottom"
              arrow={false}
              autoAdjustOverflow={false}
              content={
                <CatalogPopover onClose={() => setIsCatalogOpen(false)} />
              }
              classNames={{
                root: "catalog-popover-centered",
              }}
              overlay={{ padding: 0, borderRadius: 12 }}
            >
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#4F8A5B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3F7148]">
                Catalog
                {isCatalogOpen ? <X size={18}/> : <Menu size={18} />}
              </button>
            </Popover>

            <SearchBar
              className="flex-1 bg-slate-50"
              placeholder="Search sensors, valves, pumps..."
              onSearch={onSearch}
            />

            <div className="flex items-center gap-2">
              <Link
                to="/favorites"
                className="relative grid h-11 w-11 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
              >
                <Heart size={20} />
                {savedCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded bg-[#4F8A5B] px-1 text-[11px] font-bold text-white">
                    {savedCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="relative grid h-11 w-11 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded bg-[#4F8A5B] px-1 text-[11px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="hidden max-w-160px truncate rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
                  >
                    {user.username || user.email}
                  </Link>
                  <button
                    onClick={onLogout}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
                >
                  <User size={20} />
                </Link>
              )}
            </div>
          </div>
        </Container>
      </header>

      <MobileMenu
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        cartCount={cartCount}
        savedCount={savedCount}
      />
    </>
  );
}
