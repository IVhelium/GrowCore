export const categories = [
  {
    id: 1,
    name: "Soil Sensors",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Climate Sensors",
    image:
      "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Irrigation Parts",
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Greenhouse Control",
    image:
      "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Grow Lights",
    image:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 6,
    name: "Pumps & Valves",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 7,
    name: "Cables & Connectors",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 8,
    name: "Replacement Parts",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
  },
];

export const quickCategories = [
  "Soil Sensors",
  "Climate Sensors",
  "Irrigation Parts",
  "Greenhouse Control",
  "Grow Lights",
  "Pumps & Valves",
  "Cables & Connectors",
  "Replacement Parts",
  "Hydroponics",
  "Controllers",
  "New Arrivals",
  "Deals",
];

export const products = [
  {
    price: 46,
    oldPrice: null,
    label: "Best Seller",
    category: "Hydroponics",
    image:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=700&auto=format&fit=crop",
    rating: 4.6,
  },
  {
    id: 5,
    title: "Water Pump 12V Mini",
    description:
      "Compact pump for small irrigation, hydroponics, and water circulation systems.",
    price: 29,
    oldPrice: 35,
    label: "Deal",
    category: "Pumps & Valves",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=700&auto=format&fit=crop",
    rating: 4.8,
  },
  {
    id: 6,
    title: "Full Spectrum LED Board",
    description:
      "Replacement grow-light board for seedlings, herbs, and indoor plant racks.",
    price: 64,
    oldPrice: 79,
    label: "New",
    category: "Grow Lights",
    image:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=700&auto=format&fit=crop",
    rating: 4.5,
  },
  {
    id: 7,
    title: "Controller Relay Module",
    description:
      "Relay module for switching pumps, fans, lights, and greenhouse actuators.",
    price: 18,
    oldPrice: null,
    label: "Popular",
    category: "Controllers",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=700&auto=format&fit=crop",
    rating: 4.7,
  },
  {
    id: 8,
    title: "Waterproof Cable Set",
    description:
      "Connector and cable kit for outdoor sensors, valves, and irrigation controllers.",
    price: 14,
    oldPrice: 21,
    label: "Deal",
    category: "Cables & Connectors",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=700&auto=format&fit=crop",
    rating: 4.6,
  },
];

export const cartItems = [
  {
    id: 1,
    productId: 1,
    title: "Soil Moisture Sensor V2",
    price: 24,
    quantity: 2,
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=700&auto=format&fit=crop",
  },
  {
    id: 2,
    productId: 3,
    title: "Smart Irrigation Valve",
    price: 39,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=700&auto=format&fit=crop",
  },
];

export const savedProducts = [products[0], products[2], products[5]];

export const currentUser = {
  id: 1,
  firstName: "Max",
  lastName: "Green",
  email: "max@growcore.dev",
  phone: "+1 (800) 800-8080",
  role: "Customer",
};

export const orders = [
  { id: 1041, date: "May 19, 2026", status: "Processing", total: 87 },
  { id: 1032, date: "May 11, 2026", status: "Delivered", total: 143 },
];

export const users = [
  {
    id: 1,
    name: "Max Green",
    email: "max@growcore.dev",
    role: "Customer",
    status: "Active",
  },
  {
    id: 2,
    name: "Anna Field",
    email: "anna@growcore.dev",
    role: "Manager",
    status: "Active",
  },
  {
    id: 3,
    name: "John Miller",
    email: "john@growcore.dev",
    role: "Customer",
    status: "Blocked",
  },
  {
    id: 4,
    name: "Olivia Stone",
    email: "olivia@growcore.dev",
    role: "Support",
    status: "Active",
  },
];