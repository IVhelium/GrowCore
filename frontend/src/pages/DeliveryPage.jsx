import { MapPin, PackageCheck, Truck } from "lucide-react";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";

const deliveryOptions = [
  {
    icon: Truck,
    title: "Standard delivery",
    text: "Delivery for sensors, controllers and replacement parts within 3-5 business days.",
    price: "From 6,00 €",
  },
  {
    icon: PackageCheck,
    title: "Protected packaging",
    text: "Small electronic parts are packed with connector and probe protection.",
    price: "Included",
  },
  {
    icon: MapPin,
    title: "Pickup point",
    text: "Use pickup points for small components and cable kits.",
    price: "From 2,00 €",
  },
];

export default function DeliveryPage() {
  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Delivery"
          title="Delivery options"
          text="Delivery information for garden automation parts and greenhouse components."
        />

        <section className="grid gap-5 md:grid-cols-3">
          {deliveryOptions.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                  <Icon size={28} />
                </div>

                <h2 className="text-xl font-bold text-slate-950">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>

                <p className="mt-5 font-bold text-[#4F8A5B]">{item.price}</p>
              </article>
            );
          })}
        </section>
      </Container>
    </main>
  );
}
