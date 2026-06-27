import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import ImageWithFallback from "../common/ImageWithFallback";


export default function Hero() {
    return (
      <section className="relative overflow-hidden rounded-xl bg-[#EAF4EC] shadow-sm">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-lg bg-white/60" />

        <div className="relative grid min-h-430px items-center gap-7 p-6 md:p-10 lg:grid-cols-[1fr_380px] lg:p-12">
          <div className="max-w-xl">
            <span className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#4F8A5B] shadow-sm">
              Greenhouse automation parts
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-6xl">
              Grow smarter with reliable garden components
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Sensors, irrigation parts, pumps, valves, controllers, and
              replacement modules for gardens, greenhouses, and hydroponic
              systems
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/catalog"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#4F8A5B] px-7 py-4 font-semibold text-white transition hover:bg-[#3F7148]"
              >
                Shop parts <ChevronRight size={18} />
              </Link>
              <Link
                to="/catalog?discount=true"
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-4 font-semibold text-slate-950 transition hover:text-[#4F8A5B]"
              >
                View deals
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relatice grid aspect-square place-items-center rounded-xl bg-white/70 p-8 shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=800&auto=format&fit=crop"
                alt="Greenhouse automation"
                className="h-full w-full rounded-xl object-cover drop-shadow-2xl"
                iconSize={48}
              />
            </div>
          </div>
        </div>
      </section>
    );
}
