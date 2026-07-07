from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker

from src.core.constants import ProductModerationStatus, RoleStatus
from src.core.security import hash_password
from src.models import (
    CategoryModel,
    ProductImageModel,
    ProductModel,
    ReviewModel,
    RoleModel,
    StoreModel,
    UserModel,
    UserRoleModel,
)
from src.utils.staff_seed.roles import ensure_all_roles
from src.utils.storage_paths import product_images_directory_key, seller_products_directory_key


@dataclass(frozen=True)
class CategorySeed:
    name: str
    image_url: str
    icon_name: str


@dataclass(frozen=True)
class ProductSeed:
    title: str
    description: str
    price: str
    quantity: int
    category_name: str
    image: str
    attributes: dict[str, str]


SELLER_USERNAME = "growcore-seller"
SELLER_EMAIL = "seller@growcore.dev"
SELLER_PASSWORD = "seller123"
STORE_NAME = "GrowCore Store"


CATEGORIES = [
    CategorySeed(
        name="Soil Sensors",
        image_url="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop",
        icon_name="Droplets",
    ),
    CategorySeed(
        name="Climate Sensors",
        image_url="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?q=80&w=600&auto=format&fit=crop",
        icon_name="Thermometer",
    ),
    CategorySeed(
        name="Irrigation Parts",
        image_url="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600&auto=format&fit=crop",
        icon_name="Waves",
    ),
    CategorySeed(
        name="Greenhouse Control",
        image_url="https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=600&auto=format&fit=crop",
        icon_name="Cpu",
    ),
    CategorySeed(
        name="Grow Lights",
        image_url="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=600&auto=format&fit=crop",
        icon_name="Sun",
    ),
    CategorySeed(
        name="Pumps & Valves",
        image_url="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600&auto=format&fit=crop",
        icon_name="Gauge",
    ),
    CategorySeed(
        name="Cables & Connectors",
        image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
        icon_name="Cable",
    ),
    CategorySeed(
        name="Replacement Parts",
        image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
        icon_name="Wrench",
    ),
    CategorySeed(
        name="Hydroponics",
        image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
        icon_name="FlaskConical",
    ),
    CategorySeed(
        name="Controllers",
        image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
        icon_name="SlidersHorizontal",
    )
]


PRODUCT_IMAGES = {
    "soil": "https://source.unsplash.com/700x700/?soil,sensor,module",
    "climate": "https://source.unsplash.com/700x700/?temperature,humidity,sensor",
    "irrigation": "https://source.unsplash.com/700x700/?drip,irrigation,connector",
    "control": "https://source.unsplash.com/700x700/?greenhouse,controller,electronics",
    "light": "https://source.unsplash.com/700x700/?led,grow,light",
    "pump": "https://source.unsplash.com/700x700/?water,pump,hydroponics",
    "cable": "https://source.unsplash.com/700x700/?electronics,cable,connector",
    "part": "https://source.unsplash.com/700x700/?repair,spare,parts",
    "hydro": "https://source.unsplash.com/700x700/?hydroponics,water,garden",
    "controller": "https://source.unsplash.com/700x700/?microcontroller,relay,module",
}


def _description(
    overview: str,
    use_case: str,
    compatibility: str,
    package_includes: str,
    characteristics: dict[str, str],
) -> str:
    characteristic_lines = "\n".join(
        f"- {name}: {value}" for name, value in characteristics.items()
    )

    return (
        f"Overview:\n{overview}\n\n"
        f"Use case:\n{use_case}\n\n"
        f"Compatibility:\n{compatibility}\n\n"
        f"Package includes:\n{package_includes}\n\n"
        f"Characteristics:\n{characteristic_lines}"
    )


def _product(
    title: str,
    category_name: str,
    price: str,
    image_key: str,
    overview: str,
    use_case: str,
    compatibility: str,
    package_includes: str,
    attributes: dict[str, str],
    quantity: int = 999,
) -> ProductSeed:
    return ProductSeed(
        title=title,
        description=_description(
            overview=overview,
            use_case=use_case,
            compatibility=compatibility,
            package_includes=package_includes,
            characteristics=attributes,
        ),
        price=price,
        quantity=quantity,
        category_name=category_name,
        image=PRODUCT_IMAGES[image_key],
        attributes=attributes,
    )


PRODUCTS = [
    _product("Capacitive Soil Moisture Sensor V2", "Soil Sensors", "6.90", "soil", "Capacitive probe module for measuring soil moisture without exposed copper traces.", "Smart pots, seed trays, greenhouse benches, and DIY automatic watering projects.", "Arduino, ESP32, ESP8266, Raspberry Pi ADC hats, and 3.3-5V controllers.", "1 sensor module, 1 cable set", {"Brand": "AliGarden", "Warranty": "30 days", "Power / voltage": "3.3-5V", "Connection type": "Analog", "Waterproof rating": "Probe splash resistant"}),
    _product("Three-Wire Soil Hygrometer Probe", "Soil Sensors", "4.80", "soil", "Entry-level resistive soil humidity sensor with adjustable sensitivity board.", "Low-cost plant monitor prototypes and starter automation kits.", "Arduino UNO, Nano, ESP8266, relay modules, and comparator inputs.", "1 probe, 1 comparator board, 1 jumper cable", {"Brand": "GeekGrow", "Warranty": "30 days", "Power / voltage": "3.3-5V", "Connection type": "Analog/Digital", "Cable length": "20 cm"}),
    _product("RS485 Soil NPK Sensor Probe", "Soil Sensors", "42.50", "soil", "Sealed soil nutrient probe for nitrogen, phosphorus, and potassium readings.", "Greenhouse nutrient tracking, raised-bed logging, and agricultural test benches.", "RS485 Modbus controllers, data loggers, and industrial gateways.", "1 probe, 1 waterproof cable", {"Brand": "PlantLink", "Warranty": "90 days", "Protocol": "RS485 Modbus", "Power / voltage": "9-24V", "Waterproof rating": "IP68"}),
    _product("Digital Soil pH Meter Module", "Soil Sensors", "28.40", "soil", "Compact pH measurement module for substrate checks and nutrient solution tuning.", "Hydroponic reservoirs, coco substrate checks, and lab-style garden testing.", "BNC pH probes, Arduino, ESP32, and analog acquisition boards.", "1 signal board, 1 pH probe, calibration sachets", {"Brand": "HydroLab", "Warranty": "60 days", "Measurement range": "0-14 pH", "Accuracy": "+/-0.1 pH", "Connection type": "BNC/Analog"}),
    _product("Soil EC Conductivity Sensor Kit", "Soil Sensors", "35.20", "soil", "Electrical conductivity kit for checking salinity and nutrient strength.", "Greenhouse diagnostics, hydroponic experiments, and precision irrigation setups.", "Arduino, ESP32, 5V controllers, and analog sensor shields.", "1 EC board, 1 probe, 1 cable", {"Brand": "GrowBit", "Warranty": "60 days", "Measurement range": "0-20 ms/cm", "Power / voltage": "5V", "Connection type": "Analog"}),
    _product("DHT22 Temperature Humidity Sensor", "Climate Sensors", "5.60", "climate", "Digital temperature and humidity sensor with stable single-wire data output.", "Grow boxes, propagation chambers, and indoor climate monitoring.", "Arduino, ESP32, ESP8266, Raspberry Pi, and 3.3-5V boards.", "1 DHT22 module, 1 jumper cable", {"Brand": "Aosong", "Warranty": "30 days", "Power / voltage": "3.3-5V", "Accuracy": "+/-0.5C, +/-2% RH", "Connection type": "Digital"}),
    _product("SHT31 High Accuracy Climate Sensor", "Climate Sensors", "12.90", "climate", "I2C temperature and humidity module with fast response and stable readings.", "Climate dashboards, greenhouse controllers, and sensor calibration projects.", "I2C microcontrollers including ESP32, Arduino, STM32, and Raspberry Pi.", "1 sensor breakout, header pins", {"Brand": "SensorLab", "Warranty": "60 days", "Protocol": "I2C", "Power / voltage": "3.3-5V", "Accuracy": "+/-0.3C, +/-2% RH"}),
    _product("DS18B20 Waterproof Temperature Probe", "Climate Sensors", "3.70", "climate", "Stainless waterproof digital temperature probe with long cable.", "Reservoir temperature, soil temperature, and nutrient tank monitoring.", "1-Wire controllers, Arduino, ESP8266, ESP32, and Raspberry Pi.", "1 waterproof probe", {"Brand": "WaterTemp", "Warranty": "30 days", "Cable length": "1 m", "Waterproof rating": "IP67", "Measurement range": "-55C to 125C"}),
    _product("MH-Z19C CO2 Sensor Module", "Climate Sensors", "24.90", "climate", "NDIR carbon dioxide sensor module for enclosed grow environments.", "Grow tents, mushroom rooms, and greenhouse ventilation automation.", "UART/PWM microcontrollers, ESP32, Arduino, and serial data loggers.", "1 CO2 sensor module, 1 cable", {"Brand": "AirSense", "Warranty": "90 days", "Measurement range": "400-5000 ppm", "Power / voltage": "5V", "Connection type": "UART/PWM"}),
    _product("BH1750 Digital Light Intensity Sensor", "Climate Sensors", "2.90", "climate", "Small lux sensor board for measuring available light near the plant canopy.", "Supplemental lighting checks and automated shade or lamp triggers.", "Arduino, ESP32, ESP8266, STM32, and Raspberry Pi I2C buses.", "1 sensor module, header pins", {"Brand": "LuxGrow", "Warranty": "30 days", "Protocol": "I2C", "Power / voltage": "3.3-5V", "Measurement range": "1-65535 lux"}),
    _product("8 mm Drip Irrigation Tee Connectors 50 pcs", "Irrigation Parts", "7.40", "irrigation", "Barbed tee fittings for splitting micro drip irrigation lines.", "Garden beds, greenhouse drip networks, and balcony watering systems.", "8 mm inner-diameter PE tubing and common micro irrigation hose.", "50 tee connectors", {"Brand": "AquaFit", "Warranty": "30 days", "Material": "PP plastic", "Hose diameter": "8 mm", "Connection type": "Barbed"}),
    _product("4/7 mm Micro Drip Adjustable Emitters 100 pcs", "Irrigation Parts", "9.80", "irrigation", "Adjustable drip emitters with stake tips for individual plant watering.", "Potted plants, greenhouse rows, nursery trays, and raised beds.", "4/7 mm micro tubing, drip manifolds, and low-pressure irrigation lines.", "100 adjustable emitters", {"Brand": "DripPro", "Warranty": "30 days", "Flow rate": "0-70 L/h", "Material": "Plastic", "Connection type": "Stake emitter"}),
    _product("Garden Hose Quick Connector Set", "Irrigation Parts", "6.30", "irrigation", "Quick-release hose connector kit for fast irrigation line changes.", "Manual watering, pump outlets, and temporary greenhouse hose runs.", "1/2 inch garden hose fittings and common outdoor taps.", "4 quick connectors, 2 adapters", {"Brand": "HoseSnap", "Warranty": "30 days", "Material": "ABS plastic", "Connection type": "Quick coupler", "Hose diameter": "1/2 inch"}),
    _product("Mist Nozzle Sprayer Kit 20 pcs", "Irrigation Parts", "8.90", "irrigation", "Fine mist nozzles for humidity and gentle watering systems.", "Propagation tents, seedling trays, terrariums, and cooling lines.", "4/7 mm micro tubing and low-pressure mist irrigation layouts.", "20 mist nozzles, 20 tees", {"Brand": "MistLeaf", "Warranty": "30 days", "Flow rate": "Adjustable", "Material": "Brass/plastic", "Connection type": "Micro tube"}),
    _product("Inline Water Filter for Drip Irrigation", "Irrigation Parts", "11.50", "irrigation", "Compact mesh filter that helps protect emitters and valves from clogging.", "Drip systems fed by tanks, barrels, or outdoor taps.", "1/2 inch irrigation systems and garden hose adapters.", "1 inline filter, 1 spare mesh", {"Brand": "AquaMesh", "Warranty": "60 days", "Material": "PP body, steel mesh", "Connection type": "1/2 inch thread", "Pressure": "Low pressure"}),
    _product("Greenhouse Thermostat Controller XH-W3001", "Greenhouse Control", "9.60", "control", "Digital thermostat switch for simple heating or cooling control.", "Seedling heat mats, exhaust fans, cabinet heaters, and greenhouse vents.", "12V loads, relays, fans, heaters, and DIY climate control boxes.", "1 controller, 1 temperature probe", {"Brand": "TempSwitch", "Warranty": "60 days", "Power / voltage": "12V", "Channels": "1", "Measurement range": "-50C to 110C"}),
    _product("WiFi Smart Switch Relay Module", "Greenhouse Control", "13.80", "control", "Wireless relay board for remote switching of fans, pumps, and lighting.", "App-controlled grow rooms, irrigation pumps, and timed ventilation.", "AC/DC loads within relay limits, WiFi 2.4 GHz, and smart home scenes.", "1 relay module, mounting screws", {"Brand": "SmartGrow", "Warranty": "90 days", "Power / voltage": "5V module", "Channels": "1", "Protocol": "WiFi 2.4 GHz"}),
    _product("Dual Relay Humidity Controller", "Greenhouse Control", "18.40", "control", "Humidity controller with two relay outputs for humidify/dehumidify actions.", "Mushroom tents, propagation domes, and greenhouse humidity balancing.", "Humidifiers, exhaust fans, mist pumps, and 110-220V relay loads.", "1 controller, 1 humidity probe", {"Brand": "HumiBox", "Warranty": "60 days", "Power / voltage": "110-220V", "Channels": "2", "Measurement range": "1-99% RH"}),
    _product("Greenhouse Vent Opener Solar Cylinder", "Greenhouse Control", "21.70", "control", "Automatic thermal vent opener that works without batteries or wiring.", "Small greenhouses, cold frames, and passive ventilation windows.", "Lightweight roof vents and side windows with bracket mounting.", "1 opener cylinder, bracket kit", {"Brand": "SunVent", "Warranty": "90 days", "Material": "Aluminum/steel", "Operating temperature": "15-25C start", "Compatibility": "Manual vent frames"}),
    _product("DIN Rail Timer Switch 220V", "Greenhouse Control", "16.20", "control", "Programmable timer module for scheduled equipment control.", "Lighting cycles, irrigation windows, nutrient mixing, and fan routines.", "DIN rail boxes, 220V circuits, contactors, and relay panels.", "1 timer switch", {"Brand": "TimeRail", "Warranty": "90 days", "Power / voltage": "220V", "Channels": "1", "Mount type": "DIN rail"}),
    _product("Full Spectrum LED Grow Light Board 50W", "Grow Lights", "24.80", "light", "Flat full-spectrum LED board for seedlings, herbs, and compact grow shelves.", "Indoor propagation, kitchen herb racks, and supplemental greenhouse lighting.", "12V/24V LED drivers depending on configuration and aluminum heat sinks.", "1 LED board", {"Brand": "PlantBeam", "Warranty": "90 days", "Power draw": "50W", "Spectrum": "Full spectrum", "Mount type": "Panel"}),
    _product("E27 Full Spectrum Grow Bulb", "Grow Lights", "7.90", "light", "Screw-in LED grow bulb for small plants and desktop grow lamps.", "Single pots, bonsai lights, and simple low-cost indoor growing setups.", "Standard E27 lamp holders and 110-220V household sockets.", "1 LED bulb", {"Brand": "LeafLamp", "Warranty": "60 days", "Power draw": "28W", "Spectrum": "Full spectrum", "Mount type": "E27"}),
    _product("USB Clip Plant Grow Light Bar", "Grow Lights", "14.60", "light", "Flexible clip-on grow light with USB power and dimming modes.", "Desk plants, nursery trays, and compact shelf gardens.", "USB adapters, power banks, and small indoor plant stations.", "1 clip light, 1 USB cable", {"Brand": "ClipGrow", "Warranty": "60 days", "Power / voltage": "USB 5V", "Spectrum": "Red/blue/full", "Mount type": "Clip"}),
    _product("Samsung LM301B Style LED Strip", "Grow Lights", "19.40", "light", "High-efficiency LED strip for custom grow light builds.", "DIY quantum boards, vertical farms, and replacement light bars.", "Constant-voltage LED drivers and aluminum profile heat sinks.", "1 LED strip", {"Brand": "QuantumLeaf", "Warranty": "90 days", "Power / voltage": "24V", "Spectrum": "3500K white", "Dimensions": "50 cm"}),
    _product("Waterproof LED Grow Light Tube", "Grow Lights", "31.90", "light", "Slim waterproof LED tube for humid plant shelves and propagation racks.", "Greenhouse benches, seedling racks, and damp indoor grow areas.", "AC 110-220V installations with suitable mounting and drip protection.", "1 light tube, mounting clips", {"Brand": "WetGrow", "Warranty": "120 days", "Waterproof rating": "IP65", "Power draw": "36W", "Mount type": "Tube clips"}),
    _product("12V Mini Submersible Water Pump", "Pumps & Valves", "8.70", "pump", "Small DC submersible pump for circulating or lifting water in compact systems.", "Hydroponic buckets, desktop fountains, nutrient tanks, and drip reservoirs.", "12V DC power supplies, timers, relays, and silicone tubing.", "1 water pump", {"Brand": "AquaMini", "Warranty": "60 days", "Power / voltage": "12V", "Flow rate": "240 L/h", "Hose diameter": "8 mm"}),
    _product("Peristaltic Dosing Pump 12V", "Pumps & Valves", "12.40", "pump", "Peristaltic pump head for measured nutrient or pH solution dosing.", "Automated hydroponic dosing, aquarium additives, and lab prototypes.", "12V relays, PWM motor drivers, and silicone dosing tubes.", "1 dosing pump, 1 silicone tube", {"Brand": "DoseMate", "Warranty": "60 days", "Power / voltage": "12V", "Flow rate": "20-60 ml/min", "Connection type": "Tube"}),
    _product("12V Normally Closed Solenoid Valve", "Pumps & Valves", "10.90", "pump", "Electric solenoid valve for on/off control of irrigation water lines.", "Automatic drip irrigation, tank refill control, and water shutoff projects.", "12V DC controllers, relay modules, and low-pressure water systems.", "1 solenoid valve", {"Brand": "ValveCore", "Warranty": "90 days", "Power / voltage": "12V", "Connection type": "1/2 inch thread", "Pressure": "0.02-0.8 MPa"}),
    _product("Mini Diaphragm Booster Pump", "Pumps & Valves", "18.80", "pump", "Self-priming diaphragm pump for stronger drip or misting pressure.", "Misting lines, drip irrigation from tanks, and small transfer jobs.", "12V batteries, adapters, pressure tubing, and relay control boxes.", "1 diaphragm pump", {"Brand": "PressureLeaf", "Warranty": "90 days", "Power / voltage": "12V", "Flow rate": "3 L/min", "Pressure": "0.5 MPa"}),
    _product("Float Valve Water Level Switch", "Pumps & Valves", "3.90", "pump", "Simple float switch for detecting high or low water level.", "Reservoir refill automation, pump dry-run protection, and tank alarms.", "Arduino, ESP32, relay modules, and low-voltage control circuits.", "1 float switch", {"Brand": "TankGuard", "Warranty": "30 days", "Connection type": "Two-wire", "Material": "PP plastic", "Waterproof rating": "IP67"}),
    _product("JST-XH Sensor Cable Pack 20 pcs", "Cables & Connectors", "5.20", "cable", "Pre-crimped JST-XH cables for connecting sensors and controller boards.", "Repairing sensor leads, building controller boxes, and tidy wiring harnesses.", "2.54 mm JST-XH headers, Arduino shields, and many sensor modules.", "20 cable assemblies", {"Brand": "WireKit", "Warranty": "30 days", "Cable length": "20 cm", "Connection type": "JST-XH", "Package size": "20 pcs"}),
    _product("GX12 Aviation Plug Connector Set", "Cables & Connectors", "6.80", "cable", "Metal aviation plug connectors for removable sensor and pump cables.", "Greenhouse controller panels, waterproof-ish cable exits, and serviceable wiring.", "Low-voltage DC wiring, panel mount boxes, and multi-core cable.", "5 plug/socket pairs", {"Brand": "PanelLink", "Warranty": "30 days", "Material": "Metal shell", "Connection type": "GX12", "Pins": "4 pin"}),
    _product("Dupont Jumper Wire Kit 120 pcs", "Cables & Connectors", "4.60", "cable", "Assorted jumper wires for quick prototyping and module testing.", "Breadboard trials, sensor setup, and controller debugging.", "Arduino, Raspberry Pi GPIO, ESP32 dev boards, and breadboards.", "120 jumper wires", {"Brand": "ProtoWire", "Warranty": "30 days", "Cable length": "10/20 cm", "Connection type": "Male/female Dupont", "Package size": "120 pcs"}),
    _product("Waterproof Cable Gland Assortment", "Cables & Connectors", "7.30", "cable", "Assorted nylon glands for routing cables into controller enclosures.", "Outdoor junction boxes, pump control cases, and greenhouse sensor hubs.", "Plastic or metal project boxes with drilled cable-entry holes.", "20 cable glands", {"Brand": "SealBox", "Warranty": "30 days", "Material": "Nylon", "Waterproof rating": "IP68", "Dimensions": "M12-M20 assortment"}),
    _product("DC Barrel Jack Adapter Pack", "Cables & Connectors", "5.40", "cable", "Screw-terminal barrel adapters for fast DC power connections.", "LED drivers, pumps, solenoid valves, and controller power distribution.", "5.5 x 2.1 mm DC plugs and low-voltage power adapters.", "10 male adapters, 10 female adapters", {"Brand": "PowerDock", "Warranty": "30 days", "Connection type": "5.5 x 2.1 mm", "Power / voltage": "0-24V", "Package size": "20 pcs"}),
    _product("Replacement Peristaltic Pump Tube", "Replacement Parts", "4.20", "part", "Flexible silicone replacement tube for small dosing pump heads.", "Maintenance for nutrient dosing pumps and pH adjustment systems.", "Common Kamoer-style and generic mini peristaltic pump heads.", "5 silicone tubes", {"Brand": "DoseMate", "Warranty": "30 days", "Material": "Silicone", "Dimensions": "2 x 4 mm", "Compatibility": "Mini dosing pumps"}),
    _product("Greenhouse Vent Opener Cylinder Spare", "Replacement Parts", "13.90", "part", "Thermal cylinder replacement for automatic greenhouse vent openers.", "Restoring passive vent openers with weak or leaking cylinders.", "Most standard single-arm greenhouse vent opener brackets.", "1 replacement cylinder", {"Brand": "SunVent", "Warranty": "60 days", "Material": "Aluminum", "Compatibility": "Standard vent opener", "Operating temperature": "15-25C start"}),
    _product("Irrigation Filter Mesh Replacement 10 pcs", "Replacement Parts", "6.10", "part", "Replacement mesh inserts for small inline drip irrigation filters.", "Keeping drip systems clean during seasonal maintenance.", "1/2 inch inline filters with removable cylindrical mesh inserts.", "10 filter meshes", {"Brand": "AquaMesh", "Warranty": "30 days", "Material": "Stainless mesh", "Compatibility": "Inline drip filters", "Package size": "10 pcs"}),
    _product("LED Driver 24V 60W Replacement", "Replacement Parts", "15.70", "part", "Compact constant-voltage power supply for LED strips and light bars.", "Repairing grow shelves, LED strips, and low-voltage controller boxes.", "24V LED grow strips, fans, and low-voltage DC loads under 60W.", "1 LED driver", {"Brand": "PowerLeaf", "Warranty": "90 days", "Power / voltage": "24V", "Power draw": "60W max", "Compatibility": "24V DC LEDs"}),
    _product("Pump Impeller Repair Kit", "Replacement Parts", "8.40", "part", "Small impeller and shaft kit for repairing compatible submersible pumps.", "Restoring flow in hydroponic circulation and reservoir pumps.", "Generic mini submersible pumps with matching impeller dimensions.", "1 impeller, 1 shaft, 2 bushings", {"Brand": "AquaMini", "Warranty": "30 days", "Material": "Plastic/ceramic", "Compatibility": "Mini water pumps", "Dimensions": "Check pump size"}),
    _product("Net Pots 2 Inch Hydroponic Cups 50 pcs", "Hydroponics", "9.90", "hydro", "Slotted net cups for holding starter plugs in hydroponic systems.", "DWC buckets, NFT channels, propagation trays, and lettuce systems.", "2 inch holes, clay pebbles, rockwool plugs, and foam collars.", "50 net pots", {"Brand": "HydroCup", "Warranty": "30 days", "Material": "PP plastic", "Dimensions": "2 inch", "Package size": "50 pcs"}),
    _product("Hydroponic Air Stone Cylinder 10 pcs", "Hydroponics", "7.80", "hydro", "Porous air stones for adding oxygen to nutrient reservoirs.", "DWC systems, cloning buckets, and small hydroponic tanks.", "Aquarium air pumps, 4 mm airline tubing, and hydro reservoirs.", "10 air stones", {"Brand": "OxyRoot", "Warranty": "30 days", "Connection type": "4 mm airline", "Dimensions": "Cylinder", "Package size": "10 pcs"}),
    _product("NFT Channel End Cap Set", "Hydroponics", "12.20", "hydro", "Plastic end caps for sealing rectangular NFT grow channels.", "DIY nutrient film technique rails and modular hydroponic gutters.", "Matching rectangular PVC channels and hydroponic return plumbing.", "10 end caps", {"Brand": "NFTBuild", "Warranty": "30 days", "Material": "PVC plastic", "Compatibility": "NFT channels", "Package size": "10 pcs"}),
    _product("Clay Pebbles Hydroponic Media 1L", "Hydroponics", "5.90", "hydro", "Light expanded clay pebbles for root support and drainage.", "Net pots, orchid pots, hydroponic starts, and wicking experiments.", "Hydroponic cups, soil mixes, and reusable grow media setups.", "1 liter clay pebbles", {"Brand": "RootPebble", "Warranty": "30 days", "Material": "Expanded clay", "Volume": "1 L", "Organic": "Inert media"}),
    _product("Hydroponic Water Level Indicator Tube", "Hydroponics", "6.70", "hydro", "External sight tube kit for quickly checking reservoir water level.", "DWC buckets, nutrient tanks, and opaque storage reservoirs.", "Plastic buckets and tanks with drilled lower fitting holes.", "1 level tube, 2 fittings", {"Brand": "LevelView", "Warranty": "30 days", "Material": "Plastic tube", "Compatibility": "Reservoir tanks", "Dimensions": "30 cm"}),
    _product("ESP32 WiFi Development Board", "Controllers", "8.50", "controller", "WiFi and Bluetooth microcontroller board for smart garden projects.", "Sensor hubs, relay automation, web dashboards, and data logging.", "Arduino IDE, ESPHome, MicroPython, and 3.3V sensor modules.", "1 ESP32 development board", {"Brand": "NodeGrow", "Warranty": "60 days", "Power / voltage": "5V USB", "Protocol": "WiFi/Bluetooth", "Connection type": "GPIO"}),
    _product("4 Channel Relay Module 5V", "Controllers", "5.80", "controller", "Relay board for switching pumps, lights, fans, and solenoid valves.", "Controller cabinets, greenhouse automation, and Arduino projects.", "5V microcontrollers, opto-isolated relay control, and low-current trigger pins.", "1 relay module", {"Brand": "RelayPro", "Warranty": "60 days", "Power / voltage": "5V", "Channels": "4", "Connection type": "Screw terminal"}),
    _product("I2C LCD Display 1602 Module", "Controllers", "4.40", "controller", "Two-line character display with I2C backpack for compact controller screens.", "Local readouts for temperature, humidity, EC, pH, and pump states.", "Arduino, ESP32, Raspberry Pi, and common I2C controller boards.", "1 LCD module", {"Brand": "ScreenBit", "Warranty": "30 days", "Protocol": "I2C", "Power / voltage": "5V", "Dimensions": "16x2 display"}),
    _product("ADS1115 16 Bit ADC Module", "Controllers", "3.90", "controller", "High-resolution analog-to-digital converter board for sensor readings.", "Reading pH, EC, soil moisture, light, and pressure analog outputs.", "I2C controllers including ESP32, Arduino, Raspberry Pi, and STM32.", "1 ADC module, header pins", {"Brand": "AnalogGrow", "Warranty": "30 days", "Protocol": "I2C", "Power / voltage": "2-5.5V", "Channels": "4"}),
    _product("DC Motor PWM Speed Controller", "Controllers", "6.60", "controller", "Manual PWM controller for adjusting pump or fan speed.", "Tuning airflow, pump circulation, and small DC motor output.", "6-28V DC motors, fans, pumps, and screw-terminal wiring.", "1 PWM controller", {"Brand": "SpeedLeaf", "Warranty": "60 days", "Power / voltage": "6-28V", "Connection type": "Screw terminal", "Channels": "1"}),
]


async def _get_user_by_email(db, email: str) -> UserModel | None:
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    return result.scalar_one_or_none()


async def _ensure_seller_user(
    db,
    roles: dict[RoleStatus, RoleModel],
) -> UserModel:
    user = await _get_user_by_email(db, SELLER_EMAIL)

    if not user:
        user = UserModel(
            username=SELLER_USERNAME,
            email=SELLER_EMAIL,
            password_hash=hash_password(SELLER_PASSWORD),
        )
        db.add(user)
        await db.flush()

    for role_status in (RoleStatus.user, RoleStatus.seller):
        role = roles[role_status]
        result = await db.execute(
            select(UserRoleModel).where(
                UserRoleModel.user_id == user.id,
                UserRoleModel.role_id == role.id,
            )
        )

        if result.scalar_one_or_none():
            continue

        db.add(UserRoleModel(user_id=user.id, role_id=role.id))

    return user


async def _ensure_store(db, seller: UserModel) -> StoreModel:
    result = await db.execute(
        select(StoreModel).where(StoreModel.user_id == seller.id)
    )
    store = result.scalar_one_or_none()

    if store:
        return store

    store = StoreModel(
        name=STORE_NAME,
        description="Demo storefront for GrowCore catalog testing.",
        user_id=seller.id,
    )
    db.add(store)
    await db.flush()

    return store


async def _ensure_categories(db) -> dict[str, CategoryModel]:
    categories: dict[str, CategoryModel] = {}

    for seed in CATEGORIES:
        result = await db.execute(
            select(CategoryModel).where(CategoryModel.name == seed.name)
        )
        category = result.scalar_one_or_none()

        if not category:
            category = CategoryModel(
                name=seed.name,
                image_url=seed.image_url,
                icon_name=seed.icon_name,
            )
            db.add(category)
            await db.flush()
        else:
            category.image_url = seed.image_url

        categories[seed.name] = category

    return categories


async def _ensure_products(
    db,
    store: StoreModel,
    seller: UserModel,
    categories: dict[str, CategoryModel],
) -> None:
    seller_directory_key = seller_products_directory_key(seller)

    for seed in PRODUCTS:
        result = await db.execute(
            select(ProductModel).where(ProductModel.title == seed.title)
        )
        product = result.scalar_one_or_none()

        if not product:
            product = ProductModel(
                title=seed.title,
                description=seed.description,
                price=Decimal(seed.price),
                discount_percent=Decimal("0.00"),
                quantity=seed.quantity,
                enabled=True,
                rating_avg=Decimal("0.0"),
                rating_count=0,
                moderation_status=ProductModerationStatus.approved,
                store_id=store.id,
                category_id=categories[seed.category_name].id,
                attributes=seed.attributes,
            )
            db.add(product)
            await db.flush()

        if not product.image_storage_prefix:
            product.image_storage_prefix = product_images_directory_key(
                seller_directory_key=seller_directory_key,
                product_id=product.id,
            )

        product.description = seed.description
        product.price = Decimal(seed.price)
        product.enabled = True
        product.quantity = max(product.quantity or 0, seed.quantity)
        product.attributes = seed.attributes
        product.moderation_status = ProductModerationStatus.approved
        product.rejection_reason = None
        product.moderated_at = None
        product.moderator_id = None
        product.store_id = store.id
        product.category_id = categories[seed.category_name].id

        rating_stats = (
            await db.execute(
                select(
                    func.coalesce(func.avg(ReviewModel.rating), 0),
                    func.count(ReviewModel.id),
                ).where(
                    ReviewModel.product_id == product.id,
                    ReviewModel.parent_id.is_(None),
                    ReviewModel.rating.is_not(None),
                )
            )
        ).one()

        product.rating_avg = Decimal(str(rating_stats[0])).quantize(Decimal("0.1"))
        product.rating_count = rating_stats[1]

        image_result = await db.execute(
            select(ProductImageModel).where(
                ProductImageModel.product_id == product.id,
                ProductImageModel.image == seed.image,
            )
        )

        if image_result.scalar_one_or_none():
            continue

        db.add(
            ProductImageModel(
                product_id=product.id,
                image=seed.image,
            )
        )


async def run_catalog_seed(
    async_session_maker: async_sessionmaker,
) -> None:
    async with async_session_maker() as db:
        async with db.begin():
            roles = await ensure_all_roles(db)
            seller = await _ensure_seller_user(db, roles)
            store = await _ensure_store(db, seller)
            categories = await _ensure_categories(db)
            await _ensure_products(db, store, seller, categories)
