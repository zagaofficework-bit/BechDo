import { useState, useRef } from "react";
import { useProductContext } from "../../context/product.context";

// ─── ENUMS ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "mobile",
  "laptop",
  "tablet",
  "smartwatch",
  "television",
  "other",
];
const DEVICE_TYPES = ["new", "refurbished", "old"];
const CONDITIONS = ["Fair", "Good", "Superb"];

// ─── DROPDOWN DATA ────────────────────────────────────────────────────────────
const BRANDS_BY_CATEGORY = {
  mobile: [
    "Apple",
    "Samsung",
    "OnePlus",
    "Xiaomi",
    "Realme",
    "Oppo",
    "Vivo",
    "Google",
    "Motorola",
    "Nothing",
    "iQOO",
    "Poco",
    "Tecno",
    "Infinix",
    "Lava",
    "Other",
  ],
  laptop: [
    "Apple",
    "Dell",
    "HP",
    "Lenovo",
    "Asus",
    "Acer",
    "MSI",
    "Razer",
    "Microsoft",
    "LG",
    "Samsung",
    "Toshiba",
    "Other",
  ],
  tablet: [
    "Apple",
    "Samsung",
    "Lenovo",
    "Xiaomi",
    "Realme",
    "OnePlus",
    "Amazon",
    "Microsoft",
    "Other",
  ],
  smartwatch: [
    "Apple",
    "Samsung",
    "Garmin",
    "Fitbit",
    "Amazfit",
    "Noise",
    "boAt",
    "Fossil",
    "Titan",
    "Huawei",
    "Other",
  ],
  television: [
    "Samsung",
    "LG",
    "Sony",
    "OnePlus",
    "Xiaomi",
    "Realme",
    "TCL",
    "Hisense",
    "Panasonic",
    "Vu",
    "Other",
  ],
  other: ["Other"],
};

const RAM_OPTIONS = {
  mobile: ["1 GB", "2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"],
  laptop: ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"],
  tablet: ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"],
  smartwatch: [], // no RAM field
  television: [], // no RAM field
  other: ["2 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "32 GB"],
};

const STORAGE_OPTIONS = {
  mobile: ["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"],
  laptop: ["128 GB", "256 GB", "512 GB", "1 TB", "2 TB", "4 TB"],
  tablet: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"],
  smartwatch: ["4 GB", "8 GB", "16 GB", "32 GB"],
  television: [], // no internal storage
  other: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"],
};

const DISPLAY_TYPES = {
  mobile: [
    "AMOLED",
    "Super AMOLED",
    "Dynamic AMOLED 2x",
    "OLED",
    "IPS LCD",
    "TFT LCD",
    "Retina OLED",
    "ProMotion OLED",
  ],
  laptop: [
    "IPS",
    "OLED",
    "Retina",
    "QLED",
    "TN",
    "VA",
    "Mini-LED",
    "Micro-LED",
  ],
  tablet: ["IPS LCD", "OLED", "Liquid Retina", "TFT LCD", "AMOLED"],
  smartwatch: ["AMOLED", "OLED", "LCD", "Retina LTPO", "Transflective LCD"],
  television: [
    "OLED",
    "QLED",
    "4K LED",
    "8K LED",
    "MiniLED",
    "Micro LED",
    "NanoCell",
    "Neo QLED",
  ],
  other: ["IPS", "OLED", "AMOLED", "LCD"],
};

const REFRESH_RATES = {
  mobile: ["60 Hz", "90 Hz", "120 Hz", "144 Hz", "165 Hz"],
  laptop: ["60 Hz", "90 Hz", "120 Hz", "144 Hz", "165 Hz", "240 Hz", "360 Hz"],
  tablet: ["60 Hz", "90 Hz", "120 Hz"],
  smartwatch: ["60 Hz"],
  television: ["60 Hz", "120 Hz"],
  other: ["60 Hz", "90 Hz", "120 Hz", "144 Hz"],
};

const BATTERY_CAPACITIES = {
  mobile: [
    "2000 mAh",
    "3000 mAh",
    "4000 mAh",
    "4500 mAh",
    "5000 mAh",
    "5500 mAh",
    "6000 mAh",
  ],
  laptop: ["30 Wh", "45 Wh", "54 Wh", "60 Wh", "70 Wh", "86 Wh", "100 Wh"],
  tablet: [
    "5000 mAh",
    "6000 mAh",
    "7000 mAh",
    "8000 mAh",
    "10000 mAh",
    "11000 mAh",
  ],
  smartwatch: ["180 mAh", "250 mAh", "300 mAh", "400 mAh", "500 mAh"],
  television: [], // no battery
  other: ["2000 mAh", "3000 mAh", "4000 mAh", "5000 mAh"],
};

const CHARGING_SPEEDS = [
  "10W",
  "18W",
  "25W",
  "33W",
  "45W",
  "65W",
  "67W",
  "80W",
  "100W",
  "120W",
  "140W",
  "200W",
  "240W",
  "MagSafe 15W",
  "USB-C 96W",
];
const STORAGE_TYPES = [
  "UFS 2.1",
  "UFS 3.0",
  "UFS 3.1",
  "UFS 4.0",
  "NVMe PCIe 3.0",
  "NVMe PCIe 4.0",
  "NVMe PCIe 5.0",
  "SATA SSD",
  "eMMC",
];
const OS_OPTIONS = {
  mobile: ["Android", "iOS"],
  laptop: ["Windows 11", "Windows 10", "macOS", "Linux", "ChromeOS"],
  tablet: ["Android", "iPadOS", "Windows 11"],
  smartwatch: ["watchOS", "Wear OS", "Tizen", "HarmonyOS"],
  television: ["Android TV", "Tizen", "WebOS", "Fire TV", "Google TV"],
  other: [],
};
const TV_SIZES = [
  '24"',
  '32"',
  '40"',
  '43"',
  '50"',
  '55"',
  '65"',
  '75"',
  '85"',
  '98"',
];
const TV_RESOLUTIONS = [
  "HD (1366×768)",
  "Full HD (1920×1080)",
  "4K UHD (3840×2160)",
  "8K (7680×4320)",
];
const WATCH_SIZES = [
  "40 mm",
  "41 mm",
  "42 mm",
  "44 mm",
  "45 mm",
  "46 mm",
  "47 mm",
  "49 mm",
];
const WATCH_MATERIALS = [
  "Aluminium",
  "Stainless Steel",
  "Titanium",
  "Carbon Fibre",
  "Ceramic",
];
const CAMERA_OPTIONS = [
  "5 MP",
  "8 MP",
  "12 MP",
  "13 MP",
  "16 MP",
  "20 MP",
  "24 MP",
  "48 MP",
  "50 MP",
  "64 MP",
  "108 MP",
  "200 MP",
];

// ─── SPEC FIELDS BY CATEGORY ──────────────────────────────────────────────────
// Each entry: { key, label, type: "input"|"select"|"none", options?, required? }
const SPEC_FIELDS_BY_CATEGORY = {
  mobile: [
    {
      section: "⚡ Performance",
      fields: [
        {
          key: "chipsetFull",
          label: "Chipset (Full Name)",
          type: "input",
          placeholder: "e.g. Snapdragon 8 Elite SM8850",
          required: true,
        },
        {
          key: "ram",
          label: "RAM",
          type: "select",
          options: (cat) => RAM_OPTIONS[cat],
          required: true,
        },
        {
          key: "os",
          label: "Operating System",
          type: "select",
          options: (cat) => OS_OPTIONS[cat],
        },
      ],
    },
    {
      section: "🖥️ Display",
      fields: [
        {
          key: "sizeInches",
          label: "Display Size (inches)",
          type: "input",
          placeholder: "e.g. 6.9 inches",
          required: true,
        },
        {
          key: "displayType",
          label: "Display Type",
          type: "select",
          options: (cat) => DISPLAY_TYPES[cat],
          required: true,
        },
        {
          key: "resolution",
          label: "Resolution",
          type: "input",
          placeholder: "e.g. 3088×1440",
        },
        {
          key: "resolutionType",
          label: "Resolution Type",
          type: "input",
          placeholder: "e.g. QHD+",
        },
        {
          key: "refreshRate",
          label: "Refresh Rate",
          type: "select",
          options: (cat) => REFRESH_RATES[cat],
          required: true,
        },
      ],
    },
    {
      section: "📷 Camera",
      fields: [
        {
          key: "primaryCam",
          label: "Primary Rear Camera",
          type: "select",
          options: () => CAMERA_OPTIONS,
          required: true,
        },
        {
          key: "secondaryCam",
          label: "Secondary Rear Camera",
          type: "select",
          options: () => CAMERA_OPTIONS,
        },
        {
          key: "tertiaryCam",
          label: "Tertiary Rear Camera",
          type: "select",
          options: () => CAMERA_OPTIONS,
        },
        {
          key: "quaternaryCam",
          label: "Quaternary Rear Camera",
          type: "select",
          options: () => CAMERA_OPTIONS,
        },
        {
          key: "frontCam",
          label: "Front Camera",
          type: "select",
          options: () => CAMERA_OPTIONS,
          required: true,
        },
      ],
    },
    {
      section: "🔋 Battery",
      fields: [
        {
          key: "capacity",
          label: "Capacity",
          type: "select",
          options: (cat) => BATTERY_CAPACITIES[cat],
          required: true,
        },
        {
          key: "wiredCharging",
          label: "Wired Charging Speed",
          type: "select",
          options: () => CHARGING_SPEEDS,
        },
      ],
    },
    {
      section: "💾 Storage",
      fields: [
        {
          key: "storageType",
          label: "Storage Type",
          type: "select",
          options: () => STORAGE_TYPES,
        },
      ],
    },
  ],

  laptop: [
    {
      section: "⚡ Performance",
      fields: [
        {
          key: "chipsetFull",
          label: "Processor (Full Name)",
          type: "input",
          placeholder: "e.g. Intel Core i9-14900HX",
          required: true,
        },
        {
          key: "ram",
          label: "RAM",
          type: "select",
          options: (cat) => RAM_OPTIONS[cat],
          required: true,
        },
        {
          key: "os",
          label: "Operating System",
          type: "select",
          options: (cat) => OS_OPTIONS[cat],
        },
      ],
    },
    {
      section: "🖥️ Display",
      fields: [
        {
          key: "sizeInches",
          label: "Screen Size (inches)",
          type: "input",
          placeholder: "e.g. 15.6 inches",
          required: true,
        },
        {
          key: "displayType",
          label: "Panel Type",
          type: "select",
          options: (cat) => DISPLAY_TYPES[cat],
          required: true,
        },
        {
          key: "resolution",
          label: "Resolution",
          type: "input",
          placeholder: "e.g. 1920×1080",
        },
        {
          key: "resolutionType",
          label: "Resolution Type",
          type: "input",
          placeholder: "e.g. Full HD",
        },
        {
          key: "refreshRate",
          label: "Refresh Rate",
          type: "select",
          options: (cat) => REFRESH_RATES[cat],
          required: true,
        },
      ],
    },
    {
      section: "🔋 Battery",
      fields: [
        {
          key: "capacity",
          label: "Capacity",
          type: "select",
          options: (cat) => BATTERY_CAPACITIES[cat],
          required: true,
        },
        {
          key: "wiredCharging",
          label: "Charging",
          type: "select",
          options: () => CHARGING_SPEEDS,
        },
      ],
    },
    {
      section: "💾 Storage",
      fields: [
        {
          key: "storageType",
          label: "Storage Type",
          type: "select",
          options: () => STORAGE_TYPES,
        },
      ],
    },
  ],

  tablet: [
    {
      section: "⚡ Performance",
      fields: [
        {
          key: "chipsetFull",
          label: "Chipset (Full Name)",
          type: "input",
          placeholder: "e.g. Apple M2",
          required: true,
        },
        {
          key: "ram",
          label: "RAM",
          type: "select",
          options: (cat) => RAM_OPTIONS[cat],
          required: true,
        },
        {
          key: "os",
          label: "Operating System",
          type: "select",
          options: (cat) => OS_OPTIONS[cat],
        },
      ],
    },
    {
      section: "🖥️ Display",
      fields: [
        {
          key: "sizeInches",
          label: "Display Size (inches)",
          type: "input",
          placeholder: "e.g. 11 inches",
          required: true,
        },
        {
          key: "displayType",
          label: "Display Type",
          type: "select",
          options: (cat) => DISPLAY_TYPES[cat],
          required: true,
        },
        {
          key: "resolution",
          label: "Resolution",
          type: "input",
          placeholder: "e.g. 2360×1640",
        },
        {
          key: "refreshRate",
          label: "Refresh Rate",
          type: "select",
          options: (cat) => REFRESH_RATES[cat],
        },
      ],
    },
    {
      section: "📷 Camera",
      fields: [
        {
          key: "primaryCam",
          label: "Rear Camera",
          type: "select",
          options: () => CAMERA_OPTIONS,
          required: true,
        },
        {
          key: "frontCam",
          label: "Front Camera",
          type: "select",
          options: () => CAMERA_OPTIONS,
        },
      ],
    },
    {
      section: "🔋 Battery",
      fields: [
        {
          key: "capacity",
          label: "Capacity",
          type: "select",
          options: (cat) => BATTERY_CAPACITIES[cat],
          required: true,
        },
        {
          key: "wiredCharging",
          label: "Charging Speed",
          type: "select",
          options: () => CHARGING_SPEEDS,
        },
      ],
    },
    {
      section: "💾 Storage",
      fields: [
        {
          key: "storageType",
          label: "Storage Type",
          type: "select",
          options: () => STORAGE_TYPES,
        },
      ],
    },
  ],

  smartwatch: [
    {
      section: "⌚ Watch Details",
      fields: [
        {
          key: "watchSize",
          label: "Case Size",
          type: "select",
          options: () => WATCH_SIZES,
          required: true,
        },
        {
          key: "caseMaterial",
          label: "Case Material",
          type: "select",
          options: () => WATCH_MATERIALS,
        },
        {
          key: "os",
          label: "Operating System",
          type: "select",
          options: (cat) => OS_OPTIONS[cat],
        },
      ],
    },
    {
      section: "🖥️ Display",
      fields: [
        {
          key: "displayType",
          label: "Display Type",
          type: "select",
          options: (cat) => DISPLAY_TYPES[cat],
          required: true,
        },
        {
          key: "sizeInches",
          label: "Display Size (inches)",
          type: "input",
          placeholder: "e.g. 1.9 inches",
        },
        {
          key: "resolution",
          label: "Resolution",
          type: "input",
          placeholder: "e.g. 396×484",
        },
      ],
    },
    {
      section: "🔋 Battery",
      fields: [
        {
          key: "capacity",
          label: "Capacity",
          type: "select",
          options: (cat) => BATTERY_CAPACITIES[cat],
          required: true,
        },
      ],
    },
    {
      section: "💾 Storage",
      fields: [
        {
          key: "storageType",
          label: "Internal Storage",
          type: "select",
          options: (cat) => STORAGE_OPTIONS[cat],
        },
      ],
    },
  ],

  television: [
    {
      section: "📺 TV Details",
      fields: [
        {
          key: "tvSize",
          label: "Screen Size",
          type: "select",
          options: () => TV_SIZES,
          required: true,
        },
        {
          key: "tvResolution",
          label: "Resolution",
          type: "select",
          options: () => TV_RESOLUTIONS,
          required: true,
        },
        {
          key: "displayType",
          label: "Panel Type",
          type: "select",
          options: (cat) => DISPLAY_TYPES[cat],
          required: true,
        },
        {
          key: "refreshRate",
          label: "Refresh Rate",
          type: "select",
          options: (cat) => REFRESH_RATES[cat],
          required: true,
        },
        {
          key: "os",
          label: "Smart TV OS",
          type: "select",
          options: (cat) => OS_OPTIONS[cat],
        },
      ],
    },
    {
      section: "⚡ Hardware",
      fields: [
        {
          key: "ram",
          label: "RAM",
          type: "select",
          options: () => ["512 MB", "1 GB", "1.5 GB", "2 GB", "3 GB", "4 GB"],
        },
        {
          key: "chipsetFull",
          label: "Processor",
          type: "input",
          placeholder: "e.g. Cortex A73 Quad Core",
        },
      ],
    },
    {
      section: "💾 Storage",
      fields: [
        {
          key: "storageType",
          label: "Internal Storage",
          type: "select",
          options: () => ["8 GB", "16 GB", "32 GB", "64 GB"],
        },
      ],
    },
  ],

  other: [
    {
      section: "⚡ Performance",
      fields: [
        {
          key: "chipsetFull",
          label: "Processor / Chipset",
          type: "input",
          placeholder: "e.g. Snapdragon 695",
        },
        {
          key: "ram",
          label: "RAM",
          type: "select",
          options: (cat) => RAM_OPTIONS[cat],
        },
        {
          key: "os",
          label: "Operating System",
          type: "select",
          options: (cat) => OS_OPTIONS[cat],
        },
      ],
    },
    {
      section: "🖥️ Display",
      fields: [
        {
          key: "sizeInches",
          label: "Display Size (inches)",
          type: "input",
          placeholder: "e.g. 6.5 inches",
        },
        {
          key: "displayType",
          label: "Display Type",
          type: "select",
          options: (cat) => DISPLAY_TYPES[cat],
        },
        {
          key: "refreshRate",
          label: "Refresh Rate",
          type: "select",
          options: (cat) => REFRESH_RATES[cat],
        },
      ],
    },
    {
      section: "🔋 Battery",
      fields: [
        {
          key: "capacity",
          label: "Battery Capacity",
          type: "select",
          options: (cat) => BATTERY_CAPACITIES[cat],
        },
      ],
    },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => (n ? "₹" + Number(n).toLocaleString("en-IN") : "—");
const calcDisc = (orig, price) =>
  orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── SHARED UI ATOMS ─────────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800
      placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-[#1132d4]
      transition-all ${className}`}
    {...props}
  />
);

const Select = ({ children, className = "", ...props }) => (
  <select
    className={`w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800
      focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-[#1132d4] transition-all ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Textarea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800
      placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-[#1132d4]
      transition-all resize-none ${className}`}
    {...props}
  />
);

const ErrMsg = ({ msg }) =>
  msg ? (
    <p className="mt-1.5 text-xs text-rose-500 font-semibold">{msg}</p>
  ) : null;

const Badge = ({ children, color = "blue" }) => {
  const c = {
    blue: "bg-blue-50    text-[#1132d4]  border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sky: "bg-sky-50     text-sky-600     border-sky-200",
    rose: "bg-rose-50    text-rose-600    border-rose-200",
    indigo: "bg-indigo-50  text-indigo-600  border-indigo-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase ${c[color] || c.blue}`}
    >
      {children}
    </span>
  );
};

const SectionCard = ({ title, icon, accent, children }) => (
  <div
    className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${accent ? "border-blue-200" : "border-zinc-200"}`}
  >
    <div
      className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${accent ? "border-blue-100 bg-blue-50/60" : "border-zinc-100 bg-zinc-50/70"}`}
    >
      <span className="text-base">{icon}</span>
      <h3
        className={`text-xs font-bold tracking-widest uppercase ${accent ? "text-[#1132d4]" : "text-zinc-500"}`}
      >
        {title}
      </h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InfoRow = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
    <span className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
      {label}
    </span>
    <span
      className={`text-sm font-semibold ${highlight ? "text-[#1132d4]" : "text-zinc-700"}`}
    >
      {value || "—"}
    </span>
  </div>
);

const SpecRow = ({ label, value }) => {
  if (!value || value === "null") return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-zinc-100 last:border-0">
      <span className="text-xs uppercase tracking-widest text-zinc-400 font-medium w-32 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-zinc-700 text-right font-semibold leading-snug">
        {value}
      </span>
    </div>
  );
};

// ─── STEP BAR ─────────────────────────────────────────────────────────────────
const StepBar = ({ step }) => (
  <div className="flex items-center gap-3 mb-10">
    {[
      { n: 1, label: "Product Details" },
      { n: 2, label: "Tech Specs" },
    ].map(({ n, label }, i) => (
      <div key={n} className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-500
          ${step === n ? "bg-[#1132d4] text-white shadow-md shadow-blue-200" : step > n ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400 border border-zinc-200"}`}
        >
          {step > n ? "✓" : n}
        </div>
        <span
          className={`text-xs font-bold tracking-widest uppercase ${step === n ? "text-[#1132d4]" : step > n ? "text-emerald-500" : "text-zinc-400"}`}
        >
          {label}
        </span>
        {i < 1 && (
          <div
            className={`w-16 h-px transition-all duration-700 ${step > 1 ? "bg-emerald-400" : "bg-zinc-200"}`}
          />
        )}
      </div>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — PRODUCT DETAILS FORM
// ══════════════════════════════════════════════════════════════════════════════
const ProductDetailsForm = ({
  form,
  setForm,
  previews,
  setPreviews,
  imageFiles,
  setImageFiles,
  errors,
  onNext,
}) => {
  const imgRef = useRef();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // When category changes, reset brand so stale brand from another category isn't submitted
  const handleCategoryChange = (e) => {
    setForm((f) => ({ ...f, category: e.target.value, brand: "" }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const toAdd = files.slice(0, 5 - imageFiles.length);
    setImageFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
  };

  // At the top of ProductDetailsForm, add alongside imgRef:
  const videoRef = useRef();
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const handleVideo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setForm((f) => ({ ...f, video: file }));
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setForm((f) => ({ ...f, video: "" }));
    if (videoRef.current) videoRef.current.value = "";
  };

  const removeImage = (i) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const brands = BRANDS_BY_CATEGORY[form.category] || [];
  const storage = STORAGE_OPTIONS[form.category] || [];

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5">
        <span className="text-[#1132d4] text-lg shrink-0">💡</span>
        <p className="text-[#1132d4] text-sm font-medium">
          Select a <strong>category first</strong> — brand, storage, and spec
          fields will update automatically.
        </p>
      </div>

      {/* Basic Info */}
      <SectionCard title="Basic Information" icon="📋">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category — first so brand/storage can react */}
          <div>
            <Label required>Category</Label>
            <Select value={form.category} onChange={handleCategoryChange}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </Select>
            <ErrMsg msg={errors.category} />
          </div>

          {/* Brand — dropdown changes with category */}
          <div>
            <Label required>Brand</Label>
            {brands.length > 0 ? (
              <Select
                value={form.brand}
                onChange={set("brand")}
                disabled={!form.category}
              >
                <option value="">
                  {form.category ? "Select brand" : "Select category first"}
                </option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={form.brand}
                onChange={set("brand")}
                placeholder="Enter brand"
              />
            )}
            <ErrMsg msg={errors.brand} />
          </div>

          <div className="md:col-span-2">
            <Label required>Product Title</Label>
            <Input
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Samsung Galaxy S24 Ultra 12GB/256GB"
            />
            <ErrMsg msg={errors.title} />
          </div>

          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={set("description")}
              placeholder="Condition, accessories included, reason for selling..."
            />
          </div>

          <div>
            <Label required>Subcategory / Model Line</Label>
            <Input
              value={form.subcategory}
              onChange={set("subcategory")}
              placeholder="e.g. Galaxy S, Pixel, iQOO"
            />
            <ErrMsg msg={errors.subcategory} />
          </div>

          <div>
            <Label required>Device Type</Label>
            <Select value={form.deviceType} onChange={set("deviceType")}>
              <option value="">Select type</option>
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
            <ErrMsg msg={errors.deviceType} />
          </div>
        </div>
      </SectionCard>

      {/* Device Details */}
      <SectionCard title="Device Details" icon="📱">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label required>Condition</Label>
            <Select value={form.condition} onChange={set("condition")}>
              <option value="">Select condition</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <ErrMsg msg={errors.condition} />
          </div>

          {/* Storage — dropdown if category has options, else text */}
          <div>
            <Label required>Storage Capacity</Label>
            {storage.length > 0 ? (
              <Select
                value={form.storage}
                onChange={set("storage")}
                disabled={!form.category}
              >
                <option value="">
                  {form.category ? "Select storage" : "Select category first"}
                </option>
                {storage.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={form.storage}
                onChange={set("storage")}
                placeholder="e.g. 256GB"
              />
            )}
            <ErrMsg msg={errors.storage} />
          </div>

          <div>
            <Label required>Color</Label>
            <Input
              value={form.color}
              onChange={set("color")}
              placeholder="e.g. Titanium Black"
            />
            <ErrMsg msg={errors.color} />
          </div>
        </div>
      </SectionCard>

      {/* Pricing */}
      <SectionCard title="Pricing & Payment" icon="💰">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label required>Selling Price (₹)</Label>
            <Input
              type="number"
              min="0"
              value={form.price}
              onChange={set("price")}
              placeholder="120000"
            />
            <ErrMsg msg={errors.price} />
          </div>
          <div>
            <Label required>Original / MRP (₹)</Label>
            <Input
              type="number"
              min="0"
              value={form.originalPrice}
              onChange={set("originalPrice")}
              placeholder="139999"
            />
            <ErrMsg msg={errors.originalPrice} />
          </div>
        </div>
        {form.price &&
          form.originalPrice &&
          Number(form.originalPrice) > Number(form.price) && (
            <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <span className="text-emerald-600 font-bold text-sm">
                🎉 {calcDisc(Number(form.originalPrice), Number(form.price))}%
                discount
              </span>
              <span className="text-zinc-400 text-xs">
                — buyer saves{" "}
                {fmt(Number(form.originalPrice) - Number(form.price))}
              </span>
            </div>
          )}
      </SectionCard>

      {/* Photos */}
      <SectionCard title="Product Photos" icon="📷">
        <Label required>Images (1–5)</Label>
        <div
          onClick={() => imgRef.current.click()}
          className="mt-1 border-2 border-dashed border-zinc-300 hover:border-[#1132d4] rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-blue-50/40 group"
        >
          <div className="text-4xl mb-2 transition-transform group-hover:scale-110">
            📸
          </div>
          <p className="text-sm text-zinc-500 font-semibold">
            Click to upload images
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            PNG, JPG, WEBP — max 5 files
          </p>
        </div>
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImages}
        />
        <ErrMsg msg={errors.images} />
        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {previews.map((src, i) => (
              <div
                key={i}
                className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-200 shadow-sm"
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(i);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs items-center justify-center hidden group-hover:flex font-bold shadow"
                >
                  ×
                </button>
              </div>
            ))}
            {previews.length < 5 && (
              <div
                onClick={() => imgRef.current.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 hover:border-[#1132d4] flex items-center justify-center cursor-pointer text-zinc-300 hover:text-[#1132d4] text-2xl font-light transition-colors"
              >
                +
              </div>
            )}
          </div>
        )}
      </SectionCard>
      {/* Video */}
      <SectionCard title="Product Video" icon="🎬">
        <Label>Video (optional · max 60s)</Label>
        {!videoFile ? (
          <div
            onClick={() => videoRef.current.click()}
            className="mt-1 border-2 border-dashed border-zinc-300 hover:border-[#1132d4] rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-blue-50/40 group"
          >
            <div className="text-4xl mb-2 transition-transform group-hover:scale-110">
              🎥
            </div>
            <p className="text-sm text-zinc-500 font-semibold">
              Click to upload a video
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              MP4, MOV, WEBM — max 1 file
            </p>
          </div>
        ) : (
          <div className="mt-1 relative rounded-2xl overflow-hidden border border-zinc-200 shadow-sm bg-zinc-900">
            <video
              src={videoPreview}
              controls
              className="w-full max-h-64 object-contain"
            />
            <button
              onClick={removeVideo}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm flex items-center justify-center font-bold shadow transition-colors"
            >
              ×
            </button>
            <div className="px-3 py-2 bg-zinc-800/80 flex items-center gap-2">
              <span className="text-xs text-zinc-300 truncate">
                {videoFile.name}
              </span>
              <span className="text-xs text-zinc-500 ml-auto flex-shrink-0">
                {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          </div>
        )}
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideo}
        />
      </SectionCard>

      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5">
        <span className="text-emerald-600 text-lg shrink-0">📍</span>
        <div>
          <p className="text-emerald-800 text-sm font-bold">
            Location auto-filled from your profile
          </p>
          <p className="text-emerald-600 text-xs mt-0.5">
            Your default address and GPS coordinates are attached automatically.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          className="group flex items-center gap-3 bg-[#1132d4] hover:bg-[#0d28b8] text-white font-bold
            px-8 py-4 rounded-2xl transition-all duration-200 shadow-md shadow-blue-200
            hover:shadow-lg hover:scale-105 active:scale-95 text-sm tracking-wide uppercase"
        >
          <span>Next: Add Tech Specs</span>
          <span className="group-hover:translate-x-1 transition-transform">
            →
          </span>
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 — TECH SPECS FORM (category-aware)
// ══════════════════════════════════════════════════════════════════════════════
const TechSpecsForm = ({
  form,
  setForm,
  category,
  productTitle,
  productStorage,
  errors,
  loading,
  apiError,
  onBack,
  onSubmit,
}) => {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const sections =
    SPEC_FIELDS_BY_CATEGORY[category] || SPEC_FIELDS_BY_CATEGORY.other;

  const renderField = (field) => {
    if (field.type === "none") return null;

    const opts = field.options ? field.options(category) : [];

    // If a select has no options for this category, skip it entirely
    if (field.type === "select" && opts.length === 0) return null;

    return (
      <div key={field.key}>
        <Label required={field.required}>{field.label}</Label>
        {field.type === "select" ? (
          <Select value={form[field.key] || ""} onChange={set(field.key)}>
            <option value="">Select {field.label.toLowerCase()}</option>
            {opts.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            value={form[field.key] || ""}
            onChange={set(field.key)}
            placeholder={field.placeholder || ""}
          />
        )}
        <ErrMsg msg={errors[field.key]} />
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Context banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xl">
          ⚡
        </div>
        <div className="flex-1">
          <p className="text-[#1132d4] text-sm font-bold">
            Specs for:{" "}
            <span className="text-zinc-700">
              {productTitle || "Your product"}
            </span>
          </p>
          <p className="text-zinc-400 text-xs mt-0.5 capitalize">
            Showing fields for <strong>{category || "selected"}</strong>{" "}
            category
          </p>
        </div>
        <Badge color="blue">Step 2 of 2</Badge>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3.5">
          <span className="text-rose-400 text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-rose-700 text-sm font-bold">
              Failed to list product
            </p>
            <p className="text-rose-600 text-xs mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Dynamic spec sections */}
      {sections.map(({ section, fields }) => {
        // Filter out fields that would render nothing (select with no options)
        const visibleFields = fields.filter((f) => {
          if (f.type === "select") {
            const opts = f.options ? f.options(category) : [];
            return opts.length > 0;
          }
          return f.type !== "none";
        });
        if (visibleFields.length === 0) return null;

        return (
          <SectionCard
            key={section}
            title={section}
            icon={section.split(" ")[0]}
            accent
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleFields.map(renderField)}
            </div>
          </SectionCard>
        );
      })}

      {/* Storage hint */}
      {productStorage && (
        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3">
          <span className="text-zinc-400 text-sm">💾</span>
          <p className="text-xs text-zinc-400">
            Storage capacity{" "}
            <strong className="text-zinc-600">({productStorage})</strong> is
            already set from step 1.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 border border-zinc-200
            hover:border-zinc-400 bg-white px-6 py-3.5 rounded-2xl transition-all duration-200
            text-sm font-semibold uppercase tracking-wide shadow-sm disabled:opacity-50"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="group flex items-center gap-3 bg-[#1132d4] hover:bg-[#0d28b8] disabled:bg-blue-200
            text-white font-bold px-8 py-4 rounded-2xl transition-all duration-200 shadow-md shadow-blue-200
            hover:shadow-lg hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed
            text-sm tracking-wide uppercase"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
              <span>Listing Product...</span>
            </>
          ) : (
            <span>🚀 List Product</span>
          )}
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SUCCESS PAGE
// ══════════════════════════════════════════════════════════════════════════════
const SuccessPage = ({ product, onReset }) => {
  const s = product.specs || {};
  const d = calcDisc(product.originalPrice, product.price);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-lg">
          ✓
        </div>
        <div className="flex-1">
          <p className="text-emerald-700 text-sm font-bold">
            Product listed successfully!
          </p>
          <p className="text-zinc-400 text-xs mt-0.5 font-mono">
            ID: {product._id}
          </p>
        </div>
        <Badge color="emerald">Live</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 aspect-square shadow-sm">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl text-zinc-300">
                📱
              </div>
            )}
            {d > 0 && (
              <div className="absolute bottom-3 right-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                -{d}% OFF
              </div>
            )}
          </div>
          <SectionCard title="Pricing" icon="💰">
            <div className="flex items-end gap-3 mb-3">
              <span className="text-3xl font-bold text-[#1132d4]">
                {fmt(product.price)}
              </span>
              {product.originalPrice > 0 && (
                <span className="text-zinc-400 line-through text-base mb-0.5">
                  {fmt(product.originalPrice)}
                </span>
              )}
            </div>
            <InfoRow label="Payment" value={product.payment} />
          </SectionCard>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <SectionCard title="Product Info" icon="📋">
            <h2 className="text-2xl font-bold text-zinc-900 mb-1 tracking-tight">
              {product.title}
            </h2>
            {product.description && (
              <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                {product.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {product.brand && <Badge color="sky">{product.brand}</Badge>}
              {product.condition && (
                <Badge color="emerald">{product.condition}</Badge>
              )}
              {product.category && (
                <Badge color="blue">{product.category}</Badge>
              )}
              {product.storage && (
                <Badge color="indigo">{product.storage}</Badge>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Specs" icon="⚡">
            {s.performance?.ram && (
              <SpecRow label="RAM" value={s.performance.ram} />
            )}
            {s.performance?.chipsetFull && (
              <SpecRow label="Chipset" value={s.performance.chipsetFull} />
            )}
            {s.display?.refreshRate && (
              <SpecRow label="Refresh Rate" value={s.display.refreshRate} />
            )}
            {s.display?.type && (
              <SpecRow label="Display" value={s.display.type} />
            )}
            {s.battery?.capacity && (
              <SpecRow label="Battery" value={s.battery.capacity} />
            )}
            {s.storageType && (
              <SpecRow label="Storage Type" value={s.storageType} />
            )}
          </SectionCard>

          <SectionCard title="Timestamps" icon="🕐">
            <InfoRow label="Created" value={fmtDate(product.createdAt)} />
          </SectionCard>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onReset}
          className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold
            px-8 py-4 rounded-2xl transition-all duration-200 shadow-md shadow-emerald-200
            hover:shadow-lg hover:scale-105 active:scale-95 text-sm tracking-wide uppercase"
        >
          <span>＋</span>
          <span>List Another Product</span>
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_PRODUCT = {
  title: "",
  description: "",
  category: "",
  subcategory: "",
  brand: "",
  deviceType: "",
  condition: "",
  storage: "",
  color: "",
  price: "",
  originalPrice: "",
  payment: "",
  video: "",
};

// All possible spec keys flattened — so no key is ever undefined in form state
const ALL_SPEC_KEYS = [
  "chipsetFull",
  "ram",
  "os",
  "sizeInches",
  "sizeCm",
  "displayType",
  "resolution",
  "resolutionType",
  "refreshRate",
  "primaryCam",
  "secondaryCam",
  "tertiaryCam",
  "quaternaryCam",
  "frontCam",
  "capacity",
  "wiredCharging",
  "storageType",
  "watchSize",
  "caseMaterial",
  "tvSize",
  "tvResolution",
];
const EMPTY_SPECS = Object.fromEntries(ALL_SPEC_KEYS.map((k) => [k, ""]));

export default function AddProduct() {
  const {
    addProductSeller,
    loading,
    error: contextError,
  } = useProductContext();

  const [page, setPage] = useState("form");
  const [substep, setSubstep] = useState("product");
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");

  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [specsForm, setSpecsForm] = useState(EMPTY_SPECS);
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [productErrors, setProductErrors] = useState({});
  const [specsErrors, setSpecsErrors] = useState({});

  const category = productForm.category;

  const validateProduct = () => {
    const e = {};
    if (!productForm.title.trim()) e.title = "Title is required";
    if (!productForm.category) e.category = "Please select a category";
    if (!productForm.brand.trim()) e.brand = "Brand is required";
    if (!productForm.deviceType) e.deviceType = "Please select a device type";
    if (!productForm.condition) e.condition = "Please select condition";
    if (!productForm.storage.trim()) e.storage = "Storage capacity is required";
    if (!productForm.color.trim()) e.color = "Color is required";
    if (!productForm.price) e.price = "Price is required";
    else if (isNaN(Number(productForm.price)) || Number(productForm.price) < 0)
      e.price = "Enter a valid price";
    if (imageFiles.length === 0) e.images = "Upload at least 1 image";
    setProductErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSpecs = () => {
    const e = {};
    const sections =
      SPEC_FIELDS_BY_CATEGORY[category] || SPEC_FIELDS_BY_CATEGORY.other;
    sections.forEach(({ fields }) => {
      fields.forEach((f) => {
        if (f.required) {
          // Skip if this select has no options for category
          if (
            f.type === "select" &&
            (!f.options || f.options(category).length === 0)
          )
            return;
          if (!specsForm[f.key]?.trim()) e[f.key] = `${f.label} is required`;
        }
      });
    });
    setSpecsErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProductNext = () => {
    if (!validateProduct()) return;
    setSubstep("specs");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async () => {
    if (!validateSpecs()) return;
    setApiError("");

    // Build specs payload based on category
    const specs = {
      performance: {
        chipsetFull: specsForm.chipsetFull || null,
        ram: specsForm.ram || null,
      },
      display: {
        sizeInches: specsForm.sizeInches || specsForm.tvSize || null,
        sizeCm: specsForm.sizeCm || null,
        type: specsForm.displayType || null,
        resolution: specsForm.resolution || specsForm.tvResolution || null,
        resolutionType: specsForm.resolutionType || null,
        refreshRate: specsForm.refreshRate || null,
      },
      rearCamera: {
        primary: specsForm.primaryCam || null,
        secondary: specsForm.secondaryCam || null,
        tertiary: specsForm.tertiaryCam || null,
        quaternary: specsForm.quaternaryCam || null,
      },
      frontCamera: specsForm.frontCam || null,
      battery: {
        capacity: specsForm.capacity || null,
        wiredCharging: specsForm.wiredCharging || null,
      },
      storageType: specsForm.storageType || null,
      os: specsForm.os || null,
      // Smartwatch-specific
      ...(category === "smartwatch" && {
        watchSize: specsForm.watchSize || null,
        caseMaterial: specsForm.caseMaterial || null,
      }),
    };

    const payload = {
      ...productForm,
      price: Number(productForm.price),
      originalPrice: productForm.originalPrice
        ? Number(productForm.originalPrice)
        : null,
      images: imageFiles,
      video: productForm.video || null,
      specs,
    };

    const newProduct = await addProductSeller(payload);
    if (newProduct) {
      setResult(newProduct);
      setPage("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setApiError(contextError || "Something went wrong. Please try again.");
    }
  };

  const reset = () => {
    setPage("form");
    setSubstep("product");
    setResult(null);
    setApiError("");
    setProductForm(EMPTY_PRODUCT);
    setSpecsForm(EMPTY_SPECS);
    setImageFiles([]);
    setPreviews([]);
    setProductErrors({});
    setSpecsErrors({});
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 0.7s linear infinite; }
      `}</style>

      <div
        className="min-h-screen bg-zinc-50"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Navbar */}
        <div className="bg-white border-b border-zinc-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1132d4] flex items-center justify-center">
              <span className="text-white text-xs font-black">S</span>
            </div>
            <span className="text-sm font-bold text-zinc-800">
              Seller Portal
            </span>
            <span className="text-zinc-300 mx-1">/</span>
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">
              Add Product
            </span>
          </div>
          {category && (
            <Badge color="blue">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-[#1132d4] font-bold mb-1">
              New Listing
            </p>
            <h1 className="text-4xl font-bold text-zinc-900 tracking-tight leading-none">
              {page === "done"
                ? "Listing Published!"
                : substep === "product"
                  ? "Product Details"
                  : "Tech Specifications"}
            </h1>
            <p className="text-zinc-400 text-sm mt-2">
              {page === "done" && "Your product is live and ready for buyers."}
              {page === "form" &&
                substep === "product" &&
                "Select a category first — specs fields will adapt automatically."}
              {page === "form" &&
                substep === "specs" &&
                `Showing spec fields for ${category || "selected"} category.`}
            </p>
          </div>

          {page === "form" && <StepBar step={substep === "product" ? 1 : 2} />}

          {page === "form" && substep === "product" && (
            <ProductDetailsForm
              form={productForm}
              setForm={setProductForm}
              previews={previews}
              setPreviews={setPreviews}
              imageFiles={imageFiles}
              setImageFiles={setImageFiles}
              errors={productErrors}
              onNext={handleProductNext}
            />
          )}

          {page === "form" && substep === "specs" && (
            <TechSpecsForm
              form={specsForm}
              setForm={setSpecsForm}
              category={category}
              productTitle={productForm.title}
              productStorage={productForm.storage}
              errors={specsErrors}
              loading={loading}
              apiError={apiError}
              onBack={() => {
                setSubstep("product");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onSubmit={handleFinalSubmit}
            />
          )}

          {page === "done" && result && (
            <SuccessPage product={result} onReset={reset} />
          )}
        </div>
      </div>
    </>
  );
}
