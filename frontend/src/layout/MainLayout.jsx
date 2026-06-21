import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/layout/Header";
import TopBar from "../components/layout/TopBar"
import Footer from "../components/layout/Footer";
import MobileBottomNav from "../components/layout/MobileBottomNav";
import { useAuth } from "../hooks/useAuth";


// Main application shell for public and protected content routes.
export default function MainLayout({
  cartCount,
  savedCount,
  categories = [],
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  // Header search navigation into catalog query params.
  function handleSearch(query) {
    navigate(`/catalog?search=${encodeURIComponent(query)}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <TopBar />
      <Header
        cartCount={cartCount}
        savedCount={savedCount}
        categories={categories}
        onSearch={handleSearch}
      />
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <Outlet />
      </div>
      <Footer categories={categories} user={user} />
      <MobileBottomNav />
    </div>
  );
}
