import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY > 420);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateVisibility);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-24 right-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-[#4F8A5B] text-white shadow-lg shadow-slate-900/20 transition-opacity duration-150 hover:bg-[#3F7148] focus:outline-none focus:ring-2 focus:ring-[#4F8A5B]/40 md:bottom-6 md:right-6 ${
        isVisible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      <ArrowUp size={22} />
    </button>
  );
}
