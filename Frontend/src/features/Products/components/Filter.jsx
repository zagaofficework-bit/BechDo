import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BackButton from "../../common/BackButton";
import { useQuery } from "@tanstack/react-query";
import { productKeys } from "../../../hooks/useProducts.query";
import { getAllProducts } from "../../../services/product.api";

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

function resolveFieldValue(device, key) {
  switch (key) {
    case "specs.ram":
      return device.specs?.performance?.ram;
    case "specs.battery":
      return device.specs?.battery?.capacity;
    case "specs.display":
      return device.specs?.display?.sizeInches;
    case "specs.refresh":
      return device.specs?.display?.refreshRate;
    case "specs.camera":
      return device.specs?.rearCamera?.primary;
    case "specs.dispType":
      return device.specs?.display?.type;
    case "specs.resolution":
      return device.specs?.display?.resolutionType;
    default:
      return device[key];
  }
}

function extractSpecChips(device) {
  const chips = [];
  if (device.storage) chips.push(device.storage);
  if (device.color) chips.push(device.color);
  if (device.specs?.performance?.ram) chips.push(device.specs.performance.ram);
  if (device.specs?.performance?.chipsetFull)
    chips.push(device.specs.performance.chipsetFull);
  if (device.specs?.display?.sizeInches)
    chips.push(`${device.specs.display.sizeInches}"`);
  if (device.specs?.display?.type) chips.push(device.specs.display.type);
  if (device.specs?.display?.refreshRate)
    chips.push(device.specs.display.refreshRate);
  if (device.specs?.display?.resolutionType)
    chips.push(device.specs.display.resolutionType);
  if (device.specs?.battery?.capacity)
    chips.push(device.specs.battery.capacity);
  if (device.specs?.battery?.wiredCharging)
    chips.push(device.specs.battery.wiredCharging);
  if (device.specs?.rearCamera?.primary)
    chips.push(`${device.specs.rearCamera.primary} Rear`);
  if (device.specs?.frontCamera)
    chips.push(`${device.specs.frontCamera} Front`);
  if (device.specs?.storageType) chips.push(device.specs.storageType);
  return chips.filter(Boolean).slice(0, 6);
}

function extractSpecRows(device) {
  const rows = [];
  if (device.storage) rows.push({ label: "Storage", value: device.storage });
  if (device.color) rows.push({ label: "Color", value: device.color });
  if (device.specs?.performance?.ram)
    rows.push({ label: "RAM", value: device.specs.performance.ram });
  if (device.specs?.performance?.chipsetFull)
    rows.push({
      label: "Chipset",
      value: device.specs.performance.chipsetFull,
    });
  if (device.specs?.display?.sizeInches)
    rows.push({
      label: "Screen",
      value: `${device.specs.display.sizeInches}"`,
    });
  if (device.specs?.display?.type)
    rows.push({ label: "Display", value: device.specs.display.type });
  if (device.specs?.display?.refreshRate)
    rows.push({
      label: "Refresh Rate",
      value: device.specs.display.refreshRate,
    });
  if (device.specs?.display?.resolution)
    rows.push({ label: "Resolution", value: device.specs.display.resolution });
  if (device.specs?.display?.resolutionType)
    rows.push({ label: "Quality", value: device.specs.display.resolutionType });
  if (device.specs?.battery?.capacity)
    rows.push({ label: "Battery", value: device.specs.battery.capacity });
  if (device.specs?.battery?.wiredCharging)
    rows.push({ label: "Charging", value: device.specs.battery.wiredCharging });
  if (device.specs?.rearCamera?.primary)
    rows.push({ label: "Rear Cam", value: device.specs.rearCamera.primary });
  if (device.specs?.rearCamera?.secondary)
    rows.push({
      label: "Rear Cam 2",
      value: device.specs.rearCamera.secondary,
    });
  if (device.specs?.frontCamera)
    rows.push({ label: "Front Cam", value: device.specs.frontCamera });
  if (device.specs?.storageType)
    rows.push({ label: "Storage Type", value: device.specs.storageType });
  return rows;
}

const fmt = (v) => `₹${Number(v).toLocaleString("en-IN")}`;
const formatINR = (n) =>
  n?.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const discountPct = (p, o) =>
  p && o && o > p ? Math.round(((o - p) / o) * 100) : null;

const CONDITION_COLORS = {
  Superb: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Good: "bg-blue-50 text-blue-700 border-blue-200",
  Fair: "bg-amber-50 text-amber-700 border-amber-200",
};

const DEVICE_TYPE_COLORS = {
  new: "bg-violet-50 text-violet-700 border-violet-200",
  refurbished: "bg-cyan-50 text-cyan-700 border-cyan-200",
  old: "bg-orange-50 text-orange-700 border-orange-200",
};

// ─── STARS ────────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  if (!rating || rating <= 0) return null;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i < full ? "text-yellow-400" : i === full && half ? "text-yellow-300" : "text-gray-200"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── FILTER SECTION ───────────────────────────────────────────────────────────
function FilterSection({ filter, active, onToggle }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="px-4 pt-3 pb-1">
        <span
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "#0077b6" }}
        >
          {filter.label}
        </span>
      </div>
      <div className="px-4 pb-3">
        {filter.type === "pill" ? (
          <div className="flex flex-wrap gap-1.5">
            {filter.options.map((opt) => {
              const sel = active.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(filter.key, opt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                    sel
                      ? "text-white border-transparent shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-400"
                  }`}
                  style={
                    sel
                      ? { backgroundColor: "#0077b6", borderColor: "#0077b6" }
                      : {}
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filter.options.map((opt) => {
              const sel = active.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2.5 cursor-pointer group py-0.5"
                  onClick={() => onToggle(filter.key, opt)}
                >
                  <div
                    className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                      sel
                        ? "border-transparent"
                        : "border-gray-300 group-hover:border-gray-400"
                    }`}
                    style={
                      sel
                        ? { backgroundColor: "#0077b6", borderColor: "#0077b6" }
                        : {}
                    }
                  >
                    {sel && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors ${sel ? "font-semibold" : "text-gray-600 group-hover:text-gray-800"}`}
                    style={sel ? { color: "#0077b6" } : {}}
                  >
                    {opt}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FILTER PANEL ─────────────────────────────────────────────────────────────
function FilterPanel({
  filterConfig,
  priceRange,
  activeFilters,
  priceMin,
  priceMax,
  onToggle,
  onPriceMin,
  onPriceMax,
  onReset,
  totalActive,
  onClose,
}) {
  return (
    <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-md md:sticky md:top-[73px] md:self-start overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100"
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: "#0077b6" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4h18M7 8h10M11 12h4"
            />
          </svg>
          <span className="text-sm font-bold text-gray-800">Filters</span>
          {totalActive > 0 && (
            <span
              className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
              style={{ backgroundColor: "#0077b6" }}
            >
              {totalActive}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalActive > 0 && (
            <button
              onClick={onReset}
              className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
            >
              Reset
            </button>
          )}
          {/* Close button — mobile only */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-gray-500"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[70vh] md:max-h-[calc(100vh-140px)]">
        {/* Price Range */}
        <div className="border-b border-gray-100 px-4 pt-3 pb-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Price Range
          </span>
          <div className="mt-2 space-y-3">
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              step={priceRange.step}
              value={priceMax}
              onChange={(e) => onPriceMax(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: "#0077b6" }}
            />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 mb-1">Min (₹)</p>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => onPriceMin(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none transition-colors"
                  onFocus={(e) => (e.target.style.borderColor = "#0077b6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
              <span className="text-gray-300 mt-4 text-sm">—</span>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 mb-1">Max (₹)</p>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => onPriceMax(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none transition-colors"
                  onFocus={(e) => (e.target.style.borderColor = "#0077b6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{fmt(priceMin)}</span>
              <span>{fmt(priceMax)}</span>
            </div>
          </div>
        </div>
        {filterConfig.map((filter) => (
          <FilterSection
            key={filter.key}
            filter={filter}
            active={activeFilters[filter.key] || []}
            onToggle={onToggle}
          />
        ))}
      </div>

      {/* Mobile apply button */}
      {onClose && (
        <div className="md:hidden p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full text-white text-sm font-bold py-3 rounded-xl"
            style={{ backgroundColor: "#0077b6" }}
          >
            Apply Filters {totalActive > 0 ? `(${totalActive})` : ""}
          </button>
        </div>
      )}
    </aside>
  );
}

// ─── PREVIEW MODAL ────────────────────────────────────────────────────────────
function PreviewModal({ device, onClose }) {
  const navigate = useNavigate();
  const specRows = extractSpecRows(device);
  const imageUrl = device.images?.[0] || null;
  const title = device.title || device.name || "Product";
  const pct = discountPct(device.price, device.originalPrice);
  const savedAmt =
    device.originalPrice && device.price < device.originalPrice
      ? device.originalPrice - device.price
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      {/* On mobile: bottom sheet. On sm+: centered modal */}
      <div
        className="relative bg-white w-full sm:rounded-3xl sm:max-w-2xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image panel */}
        <div className="relative h-44 sm:h-52 flex-shrink-0 bg-white flex items-center justify-center overflow-hidden px-6">
          {savedAmt && (
            <div
              className="absolute top-0 left-0 z-10 text-white text-[11px] font-bold px-3 py-1.5 rounded-br-xl rounded-tl-2xl leading-tight"
              style={{ backgroundColor: "#005a8e" }}
            >
              ₹{formatINR(savedAmt)} OFF
            </div>
          )}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-36 sm:h-40 w-auto object-contain drop-shadow-lg"
            />
          ) : (
            <span className="text-8xl select-none">📱</span>
          )}
          {device.deviceType && (
            <span
              className={`absolute top-4 right-14 text-[9px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${DEVICE_TYPE_COLORS[device.deviceType] || ""}`}
            >
              {device.deviceType}
            </span>
          )}
          <span
            className={`absolute bottom-3 left-4 text-[9px] font-semibold px-2.5 py-1 rounded-full border ${
              device.status === "available"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {device.status === "available"
              ? "Available"
              : device.status || "Unknown"}
          </span>
        </div>

        <div className="h-px bg-gray-100 mx-6" />

        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {device.brand && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {device.brand}
              </p>
            )}
            {device.condition && (
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${CONDITION_COLORS[device.condition] || ""}`}
              >
                {device.condition}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight mb-2 tracking-tight">
            {title}
          </h2>
          {device.rating > 0 && (
            <div className="flex items-center gap-2 mb-1">
              <Stars rating={device.rating} />
              <span className="text-[11px] font-semibold text-gray-600">
                {device.rating}
              </span>
            </div>
          )}
          {pct && (
            <p className="text-red-500 font-bold text-sm mb-1">-{pct}%</p>
          )}
          <p className="text-2xl sm:text-[28px] font-extrabold text-gray-900 leading-tight">
            ₹{formatINR(device.price)}
          </p>
          {device.originalPrice && (
            <p className="text-sm text-gray-400 line-through mb-4">
              ₹{formatINR(device.originalPrice)}
            </p>
          )}
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {device.description}
          </p>

          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
            {device.payment && (
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span>
                  Accepts:{" "}
                  <span className="font-semibold text-gray-700">
                    {device.payment}
                  </span>
                </span>
              </div>
            )}
            {device.address?.city && (
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>
                  {device.address.city}
                  {device.address.state ? `, ${device.address.state}` : ""}
                </span>
              </div>
            )}
          </div>

          <div
            className="mb-4 flex items-center gap-1.5 rounded-xl px-3 py-2 border"
            style={{ backgroundColor: "#fdf6e3", borderColor: "#f0d98a" }}
          >
            <span
              className="text-[12.5px] font-bold"
              style={{ color: "#b07d0d" }}
            >
              🛡 Cashify Assured
            </span>
          </div>

          {device.listedBy && (
            <div className="flex items-center gap-1.5 mb-5">
              <span className="text-[11px] text-gray-400 font-medium">
                Sold by:
              </span>
              <span
                className="text-[12px] font-extrabold"
                style={{ color: "#0077b6" }}
              >
                {device.listedBy?.firstname} {device.listedBy?.lastname}
              </span>
            </div>
          )}

          {specRows.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 mb-6">
              {specRows.map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-2 sm:px-3 py-2.5 text-center"
                >
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                    {label}
                  </p>
                  <p className="text-xs font-bold text-gray-700 leading-tight">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              onClose();
              navigate(`/product/${device._id || device.id}`);
            }}
            className="w-full text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-lg"
            style={{ backgroundColor: "#0077b6" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#005f8f")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#0077b6")
            }
          >
            View Full Details →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <>
      {/* Mobile skeleton */}
      <div className="md:hidden flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
        <div
          className="flex-shrink-0 w-28 sm:w-36 bg-gray-100"
          style={{ minHeight: "160px" }}
        />
        <div className="flex-1 px-3 py-3 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/6" />
          <div className="h-5 bg-gray-100 rounded w-2/5" />
          <div className="h-3 bg-gray-100 rounded w-3/5" />
          <div className="flex gap-1.5 mt-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-5 w-14 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
      {/* Desktop skeleton */}
      <div className="hidden md:flex items-stretch bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
        <div className="flex-shrink-0 w-48 bg-gray-100 h-44" />
        <div className="flex-1 px-5 py-5 space-y-3">
          <div className="h-3 bg-gray-100 rounded w-1/4" />
          <div className="h-5 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-8 bg-gray-100 rounded w-full" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-5 w-16 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
        <div className="w-44 px-5 py-5 border-l border-gray-100 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-1/2 ml-auto" />
            <div className="h-7 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-3/4 ml-auto" />
          </div>
          <div className="space-y-2">
            <div className="h-9 bg-gray-100 rounded-xl w-full" />
            <div className="h-8 bg-gray-100 rounded-xl w-full" />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MOBILE DEVICE CARD ───────────────────────────────────────────────────────
function MobileDeviceCard({ device, onPreview }) {
  const navigate = useNavigate();
  const chips = extractSpecChips(device);
  const imageUrl = device.images?.[0] || null;
  const title = device.title || device.name || "Product";
  const pct = discountPct(device.price, device.originalPrice);
  const savedAmt =
    device.originalPrice && device.price < device.originalPrice
      ? device.originalPrice - device.price
      : null;

  return (
    <article
      className="flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:opacity-80 transition-opacity"
      onClick={() => navigate(`/product/${device._id || device.id}`)}
    >
      {/* Left: Image */}
      <div className="relative flex-shrink-0 w-28 sm:w-36 flex flex-col items-center justify-center bg-white px-2 py-3">
        {savedAmt && (
          <div
            className="absolute top-0 left-0 text-white text-[9px] font-bold px-2 py-1 rounded-br-lg rounded-tl-2xl leading-tight z-10"
            style={{ backgroundColor: "#005a8e" }}
          >
            ₹{formatINR(savedAmt)} OFF
          </div>
        )}
        {/* Assured badge — top */}
        <div
          className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 border mb-2 self-start"
          style={{ backgroundColor: "#fdf6e3", borderColor: "#f0d98a" }}
        >
          <span className="text-[9px] font-bold" style={{ color: "#b07d0d" }}>
            🛡 CASHIFY ASSURED
          </span>
        </div>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-20 sm:w-28 h-20 sm:h-28 object-contain drop-shadow"
            loading="lazy"
            onError={(e) => {
              e.target.src =
                "https://placehold.co/160x160/f9fafb/9ca3af?text=No+Image";
            }}
          />
        ) : (
          <span className="text-5xl select-none">📱</span>
        )}
        {device.quantity > 0 && device.quantity <= 5 && (
          <div className="mt-2 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
            {device.quantity} left
          </div>
        )}
      </div>

      {/* Right: Info */}
      <div className="flex-1 min-w-0 px-3 py-3 flex flex-col justify-between">
        <div>
          {/* Price badge + rating row */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {device.condition && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${CONDITION_COLORS[device.condition] || ""}`}
              >
                {device.condition}
              </span>
            )}
            {device.rating > 0 && (
              <span className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5">
                <svg
                  className="w-2.5 h-2.5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-[9px] font-bold text-amber-700">
                  {device.rating}
                </span>
              </span>
            )}
          </div>

          <h3 className="text-[13px] sm:text-sm font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2">
            {title}
          </h3>

          {/* Price row */}
          <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
            {pct && (
              <span className="text-[11px] font-bold text-red-500">
                -{pct}%
              </span>
            )}
            <span className="text-base sm:text-lg font-extrabold text-gray-900">
              ₹{formatINR(device.price)}
            </span>
            {device.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{formatINR(device.originalPrice)}
              </span>
            )}
          </div>

          {/* EMI / payment */}
          {device.originalPrice && device.price < device.originalPrice && (
            <p className="text-[10px] text-gray-500 mb-1.5">
              <span className="font-bold text-gray-700">
                ₹{formatINR(Math.round(device.price / 12))}
              </span>
              /month No Cost EMI
            </p>
          )}
        </div>

        {/* Spec chips */}
        <div className="flex flex-wrap gap-1 mt-1">
          {device.specs?.performance?.ram && (
            <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5">
              {device.specs.performance.ram} RAM
            </span>
          )}
          {device.storage && (
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5">
              {device.storage}
            </span>
          )}
          {chips
            .filter(
              (c) =>
                c !== device.specs?.performance?.ram && c !== device.storage,
            )
            .slice(0, 3)
            .map((chip, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5"
              >
                {chip}
              </span>
            ))}
        </div>

        {/* Quick preview link */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(device);
          }}
          className="mt-2 self-start text-[10px] font-semibold underline underline-offset-2"
          style={{ color: "#0077b6" }}
        >
          Quick Preview
        </button>
      </div>
    </article>
  );
}

// ─── DESKTOP DEVICE CARD ──────────────────────────────────────────────────────
function DesktopDeviceCard({ device, onPreview }) {
  const navigate = useNavigate();
  const chips = extractSpecChips(device);
  const imageUrl = device.images?.[0] || null;
  const title = device.title || device.name || "Product";
  const pct = discountPct(device.price, device.originalPrice);
  const savedAmt =
    device.originalPrice && device.price < device.originalPrice
      ? device.originalPrice - device.price
      : null;

  const handleCardClick = useCallback(() => {
    navigate(`/product/${device._id || device.id}`);
  }, [navigate, device._id, device.id]);

  return (
    <article
      className="group relative flex items-stretch bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative flex-shrink-0 w-44 lg:w-48 bg-white flex items-center justify-center px-4 py-4">
        {savedAmt && (
          <div
            className="absolute top-0 left-0 z-10 text-white text-[11px] font-bold px-3 py-1.5 rounded-br-xl rounded-tl-2xl leading-tight"
            style={{ backgroundColor: "#005a8e" }}
          >
            ₹{formatINR(savedAmt)} OFF
          </div>
        )}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[130px] w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow"
            loading="lazy"
            onError={(e) => {
              e.target.src =
                "https://placehold.co/160x160/f9fafb/9ca3af?text=No+Image";
            }}
          />
        ) : (
          <span className="text-6xl select-none drop-shadow">📱</span>
        )}
        {device.deviceType && (
          <span
            className={`absolute bottom-3 left-3 text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${DEVICE_TYPE_COLORS[device.deviceType] || ""}`}
          >
            {device.deviceType}
          </span>
        )}
      </div>

      <div className="w-px bg-gray-100 self-stretch" />

      <div className="flex-1 min-w-0 px-4 lg:px-5 py-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {device.brand && (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {device.brand}
              </span>
            )}
            {device.condition && (
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${CONDITION_COLORS[device.condition] || ""}`}
              >
                {device.condition}
              </span>
            )}
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                device.status === "available"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200"
              }`}
            >
              {device.status === "available" ? "In Stock" : "Unavailable"}
            </span>
          </div>
          <h3 className="text-[14px] lg:text-[15px] font-bold text-gray-900 leading-snug mb-2 line-clamp-2">
            {title}
          </h3>
          {device.rating > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Stars rating={device.rating} />
              <span className="text-[11px] font-semibold text-gray-600">
                {device.rating}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3 max-w-xl">
            {device.description}
          </p>
          {device.address?.city && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              {device.address.city}
              {device.address.state ? `, ${device.address.state}` : ""}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {device.specs?.performance?.ram && (
            <span className="text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5">
              {device.specs.performance.ram} RAM
            </span>
          )}
          {device.storage && (
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5">
              {device.storage}
            </span>
          )}
          {device.specs?.battery?.capacity && (
            <span
              className="text-xs font-semibold border rounded px-1.5 py-0.5"
              style={{
                backgroundColor: "#e8f4fd",
                color: "#0077b6",
                borderColor: "#90caf9",
              }}
            >
              {device.specs.battery.capacity}
            </span>
          )}
          {chips
            .filter(
              (c) =>
                c !== device.specs?.performance?.ram &&
                c !== device.storage &&
                c !== device.specs?.battery?.capacity,
            )
            .slice(0, 3)
            .map((chip, i) => (
              <span
                key={i}
                className="text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5"
              >
                {chip}
              </span>
            ))}
        </div>
        <div
          className="mt-3 flex items-center gap-1.5 rounded-xl px-3 py-2 border self-start"
          style={{ backgroundColor: "#fdf6e3", borderColor: "#f0d98a" }}
        >
          <span className="text-[11px] font-bold" style={{ color: "#b07d0d" }}>
            🛡 Cashify Assured
          </span>
        </div>
        {device.listedBy && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] text-gray-400 font-medium">
              Sold by:
            </span>
            <span
              className="text-[12px] font-extrabold"
              style={{ color: "#0077b6" }}
            >
              {device.listedBy?.firstname} {device.listedBy?.lastname}
            </span>
          </div>
        )}
        <p
          className="text-[10px] font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: "#0077b6" }}
        >
          Tap to view details →
        </p>
      </div>

      {/* Price + CTA */}
      <div className="flex-shrink-0 w-40 lg:w-44 px-4 lg:px-5 py-4 flex flex-col items-end justify-between border-l border-gray-100">
        <div className="flex flex-col items-end gap-0.5">
          {pct && <p className="text-red-500 font-bold text-sm">-{pct}%</p>}
          <p className="text-[20px] lg:text-[22px] font-extrabold text-gray-900 leading-tight tracking-tight">
            ₹{formatINR(device.price)}
          </p>
          {device.originalPrice && (
            <p className="text-sm text-gray-400 line-through leading-tight">
              ₹{formatINR(device.originalPrice)}
            </p>
          )}
          {device.quantity > 0 && device.quantity <= 10 && (
            <p className="text-[11px] text-gray-500 mt-1">
              Only {device.quantity} left
            </p>
          )}
          {device.payment && (
            <span className="text-[10px] text-gray-400 mt-1">
              {device.payment}
            </span>
          )}
        </div>
        <div className="w-full space-y-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="w-full text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
            style={{ backgroundColor: "#0077b6" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#005f8f")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#0077b6")
            }
          >
            View Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(device);
            }}
            className="w-full text-xs font-semibold py-2 rounded-xl border transition-colors"
            style={{ borderColor: "#0077b6", color: "#0077b6" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#e8f4fd")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            Quick Preview
          </button>
        </div>
      </div>
    </article>
  );
}

// Unified card: picks mobile or desktop version
function DeviceCard({ device, onPreview }) {
  return (
    <>
      <div className="md:hidden">
        <MobileDeviceCard device={device} onPreview={onPreview} />
      </div>
      <div className="hidden md:block">
        <DesktopDeviceCard device={device} onPreview={onPreview} />
      </div>
    </>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────
function Pagination({ pagination, onPageChange }) {
  if (!pagination?.totalPages || pagination.totalPages <= 1) return null;
  const { currentPage, totalPages } = pagination;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    )
      pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 mb-24 md:mb-0">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-2.5 sm:px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40 transition-colors hover:border-gray-400"
      >
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={i} className="text-gray-400 px-1">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-sm font-bold transition-colors border"
            style={
              p === currentPage
                ? {
                    backgroundColor: "#0077b6",
                    color: "white",
                    borderColor: "#0077b6",
                  }
                : { borderColor: "#e5e7eb", color: "#374151" }
            }
          >
            {p}
          </button>
        ),
      )}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-2.5 sm:px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40 transition-colors hover:border-gray-400"
      >
        Next →
      </button>
    </div>
  );
}

// ─── MOBILE FILTER DRAWER ─────────────────────────────────────────────────────
function MobileFilterDrawer({
  open,
  onClose,
  filterConfig,
  priceRange,
  activeFilters,
  priceMin,
  priceMax,
  onToggle,
  onPriceMin,
  onPriceMax,
  onReset,
  totalActive,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col"
        style={{ animation: "slideUp 0.25s ease" }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <FilterPanel
          filterConfig={filterConfig}
          priceRange={priceRange}
          activeFilters={activeFilters}
          priceMin={priceMin}
          priceMax={priceMax}
          onToggle={onToggle}
          onPriceMin={onPriceMin}
          onPriceMax={onPriceMax}
          onReset={onReset}
          totalActive={totalActive}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

// ─── MOBILE SORT DRAWER ───────────────────────────────────────────────────────
function MobileSortDrawer({ open, onClose, sortBy, onSort }) {
  if (!open) return null;
  const options = [
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "rating", label: "Top Rated" },
    { value: "discount", label: "Best Discount" },
  ];
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
        style={{ animation: "slideUp 0.25s ease" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="px-4 pb-2 border-b border-gray-100">
          <p className="text-base font-bold text-gray-800 py-2">Sort By</p>
        </div>
        <div className="py-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onSort(opt.value);
                onClose();
              }}
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium transition-colors hover:bg-gray-50"
            >
              <span
                style={
                  sortBy === opt.value
                    ? { color: "#0077b6", fontWeight: 700 }
                    : { color: "#374151" }
                }
              >
                {opt.label}
              </span>
              {sortBy === opt.value && (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: "#0077b6" }}
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className="p-4 pb-8">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function Filter({ data, category }) {
  const {
    pageTitle = "Devices",
    filterConfig = [],
    devices: staticDevices = [],
    priceRange = { min: 0, max: 200000, step: 1000 },
  } = data || {};
  const [searchParams] = useSearchParams();

  const initialFilters = () => {
    const pre = {};
    for (const [key, val] of searchParams.entries()) {
      if (!val) continue;
      // deviceType: URL lowercase ("refurbished") → UI Title Case ("Refurbished")
      if (key === "deviceType") {
        pre[key] = [val.charAt(0).toUpperCase() + val.slice(1)];
      }
      if (key === "brand") {
        pre[key] = [val.charAt(0).toUpperCase() + val.slice(1)];
      } else {
        pre[key] = [val];
      }
    }
    return pre;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeFilters, setActiveFilters] = useState(initialFilters);

  const [priceMin, setPriceMin] = useState(priceRange.min);
  const [priceMax, setPriceMax] = useState(priceRange.max);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState(null);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 400);

  // ← ADD THIS: re-sync filters when URL search params change
  useEffect(() => {
    setActiveFilters(initialFilters());
  }, [searchParams.toString()]);

  const apiFilters = useMemo(() => {
    const params = {
      category,
      status: "available",
      sortBy,
      limit: 20,
      page,
    };

    if (priceMin > priceRange.min) params.minPrice = priceMin;
    if (priceMax < priceRange.max) params.maxPrice = priceMax;
    if (debouncedSearch) params.search = debouncedSearch;

    for (const [key, vals] of Object.entries(activeFilters)) {
      if (!vals.length) continue;

      if (key === "deviceType") {
        params.deviceType = vals[0].toLowerCase();
        continue;
      }
      if (key === "condition") {
        params.condition = vals[0];
        continue;
      }
      if (key === "brand") {
        params.brand = vals[0];
        continue;
      }
      if (key === "storage") {
        params.storage = vals[0];
        continue;
      }
    }

    return params;
  }, [
    category,
    sortBy,
    priceMin,
    priceMax,
    debouncedSearch,
    activeFilters,
    priceRange,
    page,
  ]);

    const {
    data: queryData,
    isLoading,
    error,
  } = useQuery({
    queryKey: productKeys.list(apiFilters),
    queryFn: () => getAllProducts(apiFilters),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });

  const products = queryData?.products ?? [];
  const pagination = queryData?.pagination ?? {};

  const sourceDevices = products.length > 0 ? products : staticDevices;

  const filtered = useMemo(() => {
    let list = sourceDevices.filter((d) => {
      const name = d.title || d.name || "";
      if (
        searchQuery &&
        !name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (d.price < priceMin || d.price > priceMax) return false;
      for (const [key, vals] of Object.entries(activeFilters)) {
        if (!vals.length) continue;
        if (key === "availability") {
          const isAvail = d.status === "available";
          if (
            vals.includes("In Stock") &&
            !vals.includes("Out of Stock") &&
            !isAvail
          )
            return false;
          if (
            !vals.includes("In Stock") &&
            vals.includes("Out of Stock") &&
            isAvail
          )
            return false;
          continue;
        }
        if (key === "deviceType") {
          if (
            !vals.some((v) => v.toLowerCase() === d.deviceType?.toLowerCase())
          )
            return false;
          continue;
        }
        if (key === "brand") {
          if (!vals.some((v) => v.toLowerCase() === d.brand?.toLowerCase()))
            return false;
          continue;
        }
        if (key.startsWith("specs.")) {
          const fieldVal = resolveFieldValue(d, key);
          if (fieldVal == null) return false;
          const norm = (s) => String(s).replace(/\s+/g, "").toLowerCase();
          if (
            !vals.some(
              (v) =>
                norm(fieldVal).includes(norm(v)) ||
                norm(v).includes(norm(fieldVal)),
            )
          )
            return false;
          continue;
        }
        if (!vals.includes(d[key])) return false;
      }
      return true;
    });
    if (sortBy === "price_asc")
      list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc")
      list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "rating")
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === "discount")
      list = [...list].sort((a, b) => {
        const da = discountPct(a.price, a.originalPrice) || 0;
        const db = discountPct(b.price, b.originalPrice) || 0;
        return db - da;
      });
    return list;
  }, [sourceDevices, searchQuery, priceMin, priceMax, activeFilters, sortBy]);

  const toggleFilter = (key, val) =>
    setActiveFilters((prev) => {
      const cur = prev[key] || [];
      return {
        ...prev,
        [key]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val],
      };
    });

  const resetAll = () => {
    setActiveFilters({});
    setPriceMin(priceRange.min);
    setPriceMax(priceRange.max);
    setSearchQuery("");
    resetFilters();
    fetchProducts({
      category,
      status: "available",
      sortBy: "newest",
      limit: 20,
    });
  };

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalActive = Object.values(activeFilters).reduce(
    (s, a) => s + a.length,
    0,
  );
  const activeChips = Object.entries(activeFilters).flatMap(([key, vals]) =>
    vals.map((val) => ({ key, val })),
  );

  return (
    <div
      className="min-h-screen pb-24 md:pb-0"
      style={{ backgroundColor: "#f5f5f5" }}
    >
      {previewDevice && (
        <PreviewModal
          device={previewDevice}
          onClose={() => setPreviewDevice(null)}
        />
      )}

      {/* Mobile drawers */}
      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filterConfig={filterConfig}
        priceRange={priceRange}
        activeFilters={activeFilters}
        priceMin={priceMin}
        priceMax={priceMax}
        onToggle={toggleFilter}
        onPriceMin={setPriceMin}
        onPriceMax={setPriceMax}
        onReset={resetAll}
        totalActive={totalActive}
      />
      <MobileSortDrawer
        open={mobileSortOpen}
        onClose={() => setMobileSortOpen(false)}
        sortBy={sortBy}
        onSort={setSortBy}
      />

      {/* ── Desktop top bar ── */}
      <div className="hidden md:flex bg-white border-b border-gray-100 px-4 lg:px-6 py-4 sticky top-0 z-20 items-center gap-3 lg:gap-4 flex-wrap shadow-sm mx-8 rounded-2xl rounded-2xl">
        <BackButton />
        <div className="mr-2 flex-shrink-0">
          <h1 className="text-lg font-extrabold text-gray-900 leading-none">
            {pageTitle}
            <span style={{ color: "#0077b6" }}>.</span>
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5 capitalize">
            {category} · Filter and find your device
          </p>
        </div>
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter"}
            placeholder={`Search ${pageTitle.toLowerCase()}…`}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
            onFocus={(e) => {
              e.target.style.borderColor = "#0077b6";
              e.target.style.boxShadow = "0 0 0 3px rgba(0,119,182,0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 bg-white focus:outline-none cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="rating">Top Rated</option>
          <option value="discount">Best Discount</option>
        </select>
        <button
          className="text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
          style={{ backgroundColor: "#0077b6" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#005f8f")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#0077b6")
          }
        >
          Apply
        </button>
      </div>

      {/* ── Mobile top bar — just title + search ── */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-base font-extrabold text-gray-900">
            {pageTitle}
            <span style={{ color: "#0077b6" }}>.</span>
          </h1>
          <span className="text-xs text-gray-400 capitalize">
            {filtered.length} results
          </span>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${pageTitle.toLowerCase()}…`}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            onFocus={(e) => (e.target.style.borderColor = "#0077b6")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 md:flex md:gap-6 md:items-start">
        {/* Desktop filter sidebar */}
        <div className="hidden md:block">
          <FilterPanel
            filterConfig={filterConfig}
            priceRange={priceRange}
            activeFilters={activeFilters}
            priceMin={priceMin}
            priceMax={priceMax}
            onToggle={toggleFilter}
            onPriceMin={setPriceMin}
            onPriceMax={setPriceMax}
            onReset={resetAll}
            totalActive={totalActive}
          />
        </div>

        <div className="flex-1 min-w-0">
          {error && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Backend unreachable — showing demo data. ({error?.message})
            </div>
          )}

          {/* Results count + active chips */}
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <p className="text-sm text-gray-500 pt-1">
              <span className="font-bold text-gray-900">{filtered.length}</span>
              {pagination?.total
                ? ` of ${pagination.total}`
                : ` of ${sourceDevices.length}`}{" "}
              {pageTitle.toLowerCase()} found
            </p>
            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                {activeChips.map(({ key, val }) => (
                  <button
                    key={`${key}-${val}`}
                    onClick={() => toggleFilter(key, val)}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: "#e8f4fd",
                      color: "#0077b6",
                      borderColor: "#90caf9",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#cce5f6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#e8f4fd")
                    }
                  >
                    {val}
                    <svg
                      className="w-2.5 h-2.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ))}
                <button
                  onClick={resetAll}
                  className="text-[10px] font-semibold text-red-500 hover:text-red-600 px-1 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-5xl mb-4">🔍</span>
              <p className="text-gray-800 font-bold text-base mb-1">
                No {pageTitle.toLowerCase()} match your filters
              </p>
              <p className="text-gray-400 text-sm mb-5">
                Try relaxing or clearing your filters
              </p>
              <button
                onClick={resetAll}
                className="text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
                style={{ backgroundColor: "#0077b6" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#005f8f")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#0077b6")
                }
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {filtered.map((device) => (
                  <DeviceCard
                    key={device._id || device.id}
                    device={device}
                    onPreview={setPreviewDevice}
                  />
                ))}
              </div>
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-gray-200 flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold text-gray-700 border-r border-gray-200 active:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4h18M7 8h10M11 12h4"
            />
          </svg>
          Filters
          {totalActive > 0 && (
            <span
              className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5"
              style={{ backgroundColor: "#0077b6" }}
            >
              {totalActive}
            </span>
          )}
        </button>
        <button
          onClick={() => setMobileSortOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold text-gray-700 active:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 6h18M6 12h12M9 18h6"
            />
          </svg>
          Sort
        </button>
      </div>
    </div>
  );
}
