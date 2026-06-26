import {
  BatteryCharging, Box, Cable, CircleGauge, CloudRain, CloudSun, Cog, Cpu,
  Droplets, Fan, FlaskConical, Flower2, Gauge, Hammer, Leaf, Lightbulb,
  Microscope, Package, Power, RadioTower, Settings, ShoppingBasket,
  SlidersHorizontal, Sprout, Sun, Thermometer, Timer, Tractor, Trees,
  TestTube2, Warehouse, Waves, Wifi, Wind, Wrench, Zap,
} from "lucide-react";

const iconMap = {
  BatteryCharging, Box, Cable, CircleGauge, CloudRain, CloudSun, Cog, Cpu,
  Droplets, Fan, FlaskConical, Flower2, Gauge, Hammer, Leaf, Lightbulb,
  Microscope, Package, Power, RadioTower, Settings, ShoppingBasket,
  SlidersHorizontal, Sprout, Sun, Thermometer, Timer, Tractor, Trees,
  TestTube2, Warehouse, Waves, Wifi, Wind, Wrench, Zap,
};

const categoryIcons = {
  "Soil Sensors": Droplets, "Climate Sensors": Thermometer,
  "Irrigation Parts": Waves, "Greenhouse Control": Cpu,
  "Grow Lights": Sun, "Pumps & Valves": Gauge,
  "Cables & Connectors": Cable, "Replacement Parts": Wrench,
  Hydroponics: FlaskConical, Controllers: SlidersHorizontal,
};

export const categoryIconOptions = Object.entries(iconMap);

export function getCategoryIcon(categoryOrName) {
  // Chooses an icon component from a category object or category name.
  if (typeof categoryOrName === "object" && categoryOrName?.iconName) {
    return iconMap[categoryOrName.iconName] || SlidersHorizontal;
  }
  return categoryIcons[categoryOrName] || SlidersHorizontal;
}
