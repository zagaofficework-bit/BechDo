// SellDevices.jsx — Responsive

import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  faShieldAlt,
  faBolt,
  faMoneyBillWave,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSellFlow } from "../../../context/sellflow.context";
import toast from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";

const benefits = [
  {
    icon: faShieldAlt,
    title: "Safe & Secure",
    description:
      "Select your device & we'll help you unlock the best selling price based on the present conditions of your gadget & the current market price.",
  },
  {
    icon: faBolt,
    title: "Instant Payment",
    description:
      "On accepting the price offered for your device, we'll arrange a free pick up.",
  },
  {
    icon: faMoneyBillWave,
    title: "Best Price",
    description:
      "Instant Cash will be handed over to you at time of pickup or through payment mode of your choice.",
  },
];

export default function SellDevices({
  models = [],
  brand,
  category,
  loading = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setSelectedModel } = useSellFlow();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  if (user?.role === "seller") {
    return <SellerCannotSellPage />;
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (model) => {
    if (!model?.id || !model?.name) {
      toast.error("Invalid model selected");
      return;
    }
    setSelectedModel({
      id: model.id,
      name: model.name,
      image: model.image,
      soldCount: model.soldCount,
    });
    navigate("/sell/variant");
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(models)) return [];
    return models.filter((m) =>
      m?.name?.toLowerCase().includes(query.toLowerCase()),
    );
  }, [models, query]);

  return (
    <>
      <style>{`
        @media(max-width:640px){
          .sd-header { padding: 24px 16px 0 !important; }
          .sd-header h2 { font-size: 22px !important; }
          .sd-search-wrap { justify-content: flex-start !important; margin-bottom: 16px; }
          .sd-search-wrap input { width: 100% !important; }
          .sd-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .sd-model-card { padding: 12px 8px !important; }
          .sd-model-img  { width: 60px !important; height: 88px !important; }
          .sd-benefits { padding: 24px 16px !important; }
          .sd-benefits h2 { font-size: 22px !important; }
          .sd-benefits-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
        @media(min-width:641px) and (max-width:1024px){
          .sd-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .sd-benefits-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      <section className="sd-header bg-gray-50 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Sell Old {brand}</h2>

          <div className="sd-search-wrap flex justify-end mb-6">
            <input
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length <= 50) setQuery(v);
              }}
              type="text"
              placeholder="Search model"
              className="border rounded-lg px-4 py-2 w-64 focus:ring focus:ring-teal-300"
              style={{ width: "100%", maxWidth: 260 }}
            />
          </div>

          {loading ? (
            <p className="text-center py-12">Loading models...</p>
          ) : models.length === 0 ? (
            <p className="text-center text-gray-400 py-12">
              No models found for {brand}.
            </p>
          ) : (
            <div className="sd-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {filtered.map((model) => (
                <div
                  key={model.id || model.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(model)}
                  className="sd-model-card flex flex-col items-center bg-white rounded-lg shadow p-4 hover:shadow-md cursor-pointer transition"
                >
                  <div className="sd-model-img w-45 h-35 flex items-center justify-center mb-2">
                    {model.image ? (
                      <img
                        src={model.image}
                        alt={model.name}
                        className="object-contain h-full"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/fallback-device.png";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-100 rounded-lg" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 text-center">
                    {model.name}
                  </p>
                  {model.soldCount > 0 && (
                    <p className="text-xs text-teal-600 mt-1">
                      {model.soldCount.toLocaleString("en-IN")}+ sold
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && models.length > 0 && (
            <p className="text-center text-gray-400 py-6">
              No results found for "{query}"
            </p>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="sd-benefits bg-gray-50 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Why Sell On Phonify?
          </h2>
          <div className="sd-benefits-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <FontAwesomeIcon
                  icon={b.icon}
                  className="text-teal-600 text-5xl mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">{b.title}</h3>
                <p className="text-gray-600 text-sm">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
