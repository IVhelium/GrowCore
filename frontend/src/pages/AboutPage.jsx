import { Leaf, ShieldCheck, Store, Truck } from "lucide-react";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";

const values = [
  {
    icon: Leaf,
    title: "Focused catalog",
    text: "GrowCore is built around garden automation: sensors, controllers, pumps, valves, greenhouse parts, and reliable replacement components.",
  },
  {
    icon: Store,
    title: "Seller moderation",
    text: "Sellers apply before publishing products, and new listings are reviewed before they appear in the public catalog.",
  },
  {
    icon: ShieldCheck,
    title: "Safer orders",
    text: "Orders keep payment, delivery, return, and support status in one place so buyers and staff can track the full workflow.",
  },
  {
    icon: Truck,
    title: "Practical support",
    text: "Support requests help users resolve account, payment, seller, return, and technical questions without losing context.",
  },
];

export default function AboutPage() {
  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="About"
          title="About GrowCore"
          text="A marketplace for smart gardening parts, greenhouse automation, and the small components that keep growing systems running."
        />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-bold text-slate-950">
              Built for growers, sellers, and support teams
            </h2>
            <p className="break-anywhere mt-4 leading-7 text-slate-600">
              GrowCore connects buyers with garden automation hardware and gives
              sellers a structured way to publish moderated product listings.
              The platform combines catalog search, favorites, carts, checkout,
              order history, seller workflows, support tickets, and admin tools.
            </p>
            <p className="break-anywhere mt-4 leading-7 text-slate-600">
              The goal is a practical marketplace experience: clear product
              data, visible moderation status, protected seller documents, and
              support conversations that stay attached to the user account.
            </p>
          </div>

          <aside className="rounded-xl border border-[#4F8A5B]/20 bg-[#F2F8F3] p-6">
            <h3 className="text-xl font-bold text-slate-950">
              What we care about
            </h3>
            <p className="break-anywhere mt-3 text-sm leading-6 text-slate-600">
              Useful product details, accountable sellers, clear support
              handling, and checkout flows that can grow into production Stripe
              payments.
            </p>
          </aside>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {values.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                  <Icon size={24} />
                </div>
                <h3 className="break-anywhere mt-4 font-bold text-slate-950">
                  {item.title}
                </h3>
                <p className="break-anywhere mt-2 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>
              </article>
            );
          })}
        </section>
      </Container>
    </main>
  );
}
