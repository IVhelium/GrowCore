import { RotateCcw, ShieldCheck, Truck } from "lucide-react";



const items = [
    {
        icon: Truck,
        title: "Fast parts delivery",
        description: "Daily dispatch for sensors, valves, pumps, and greenhouse spare parts",
    },
    {
        icon: ShieldCheck,
        title: "Tested components",
        description: "Selected modules and spare parts for reliable garden automation",
    },
    {
        icon: RotateCcw,
        title: "Easy replacements",
        description: "Simple replacement flow for eligible sensors and spare parts"
    }
];


export default function Benefits() {
    return (
        <section>
            <div className="grid gap-5 md:grid-cols-3">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article
                        key={item.title}
                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                      >
                        <div className="mb-5 grid h-14 w-14 place-content-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                          <Icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-950">{item.title}</h3>
                        <p className="mt-2 leading-7 text-slate-500">{item.description}</p>
                      </article>
                    );
                })}
            </div>
        </section>
    );
}