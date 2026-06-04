import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import TopBar from "../components/layout/TopBar"
import Footer from "../components/layout/Footer";
import MobileBottomNav from "../components/layout/MobileBottomNav";


// Main application shell for public and protected content routes.
export default function MainLayout({
  cartCount,
  savedCount,
  categories = [],
}) {
  const navigate = useNavigate();

  // Header search navigation into catalog query params.
  function handleSearch(query) {
    navigate(`/catalog?search=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar />
      <Header
        cartCount={cartCount}
        savedCount={savedCount}
        categories={categories}
        onSearch={handleSearch}
      />
      <Outlet />          {/* Nested page route outlet below the shared shell */}
      <Footer categories={categories} />
      <MobileBottomNav />
    </div>
  );
}
