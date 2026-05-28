import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import TopBar from "../components/layout/TopBar"
import Footer from "../components/layout/Footer";
import MobileBottomNav from "../components/layout/MobileBottomNav";


export default function MainLayout({
  cartCount,
  savedCount,
}) {
  const navigate = useNavigate();

  function handleSearch(query) {
    navigate(`/catalog?search=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar />
      <Header
        cartCount={cartCount}
        savedCount={savedCount}
        onSearch={handleSearch}
      />
      <Outlet />          {/* Specifies the positioning of the embedded content; the top of the layout remains fixed */}
      <Footer />
      <MobileBottomNav />
    </div>
  );
}