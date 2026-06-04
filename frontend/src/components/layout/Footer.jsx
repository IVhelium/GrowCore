import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import Container from "../common/Container";


// Site footer with backend category links and static informational links.
export default function Footer({ categories = [] }) {
    return (
      <footer className="mt-10 border-t border-slate-200 bg-white pb-20 md:pb-0">
        <Container className="grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Link
              to="/"
              className="flex items-center gap-2 text-2xl font-black text-[#4F8A5B]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#4F8A5B]">
                <Leaf size={22} className="text-white" />
              </span>
              GrowCore
            </Link>
            <p className="mt-4 max-w-sm leading-7 text-slate-500">
              Garden automation parts marketplace for soil sensors, climate
              probes, pumps, valves, controllers, and replacement modules
            </p>
          </div>

          {/* Backend category links */}
          <div>
            <h3 className="mb-4 font-bold text-slate-950">Catalog</h3>
            <nav className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-500">
              {categories.slice(0, 10).map((category) => (
                <Link
                  key={category.id}
                  to={`/catalog?category=${category.id}`}
                  className="transition hover:text-[#4F8A5B]"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Static company links */}
          <div>
            <h3 className="mb-4 font-bold text-slate-950">Company</h3>
            <nav className="grid gap-2 text-sm text-slate-500">
              <Link to="/about" className="transition hover:text-[#4F8A5B]">
                About Us
              </Link>
              <Link to="/support" className="transition hover:text-[#4F8A5B]">
                Support
              </Link>
              <Link to="/payment" className="transition hover:text-[#4F8A5B]">
                Payment
              </Link>
              <Link to="/delivery" className="transition hover:text-[#4F8A5B]">
                Delivery
              </Link>
              <Link to="/returns" className="transition hover:text-[#4F8A5B]">
                Returns
              </Link>
            </nav>
          </div>

          {/* Contact information */}
          <div>
            <h3 className="mb-4 font-bold text-slate-950">Contacts</h3>
            <div className="grid gap-3 text-sm text-slate-950">
              <a
                href="tel:+351930050384"
                className="font-semibold text-slate-950"
              >
                +351 930 050 384
              </a>
              <span>Parts dispatch from 8:00 to 23:00</span>
              <span>Adress</span>
              <button className="mt-2 rounded-lg bg-[#4F8A5B] px-5 py-3 font-semibold text-white transition hover:bg-[#3F7148]">
                Request a callback
              </button>
            </div>
          </div>
        </Container>

        <div className="border-t border-slate-100 px-4 py-5 text-center text-sm text-slate-400">
          © GrowCore
        </div>
      </footer>
    );
}
