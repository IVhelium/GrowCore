import {
  Cable,
  Cpu,
  Droplets,
  FlaskConical,
  Gauge,
  SlidersHorizontal,
  Sun,
  Thermometer,
  Waves,
  Wrench,
} from "lucide-react";

// Frontend-only icon mapping for backend category names.
const categoryIcons = {
  "Soil Sensors": Droplets,
  "Climate Sensors": Thermometer,
  "Irrigation Parts": Waves,
  "Greenhouse Control": Cpu,
  "Grow Lights": Sun,
  "Pumps & Valves": Gauge,
  "Cables & Connectors": Cable,
  "Replacement Parts": Wrench,
  "Hydroponics": FlaskConical,
  "Controllers": SlidersHorizontal
};

// Generic icon fallback for unknown category names.
export function getCategoryIcon(categoryName) {
  return categoryIcons[categoryName] || SlidersHorizontal;
}
