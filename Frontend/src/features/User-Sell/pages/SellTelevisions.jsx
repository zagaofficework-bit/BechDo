// src/pages/sell/SellPhones.jsx
//
// Landing page for the sell flow.
// Fetches real brands from the API for the selected category.
// Clicking a brand navigates to /sell/:category/:brand (SelectModel).
//
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SellCard from "../components/SellCard";
import Feedback from "../../Auth/components/Feedback";
import FAQ from "../../Auth/components/FAQ";
import DownloadAppBanner from "../../Auth/components/DownloadAppBanner";
import Footer from "../../Auth/components/Footer";
import { getBrands } from "../../../services/deviceSell.api";
import { useSellFlow } from "../../../context/sellflow.context";
import { useAuth } from "../../../hooks/useAuth";
import SellerCannotSellPage from "./SellerCannotSellPage";

// Brand logo map — add more as needed
const BRAND_LOGOS = {
  Apple:
    "../../../../assets/devicesicons/Apple.png",
  Samsung:
    "../../../../assets/devicesicons/samsung.png",
  Xiaomi: "../../../../assets/devicesicons/Xiaomi.png",
  Vivo: "../../../../assets/devicesicons/Vivo.png",
  Oppo: "../../../../assets/devicesicons/Oppo.png",
  OnePlus:
    "../../../../assets/devicesicons/OnePlus.png",
  Realme: "../../../../assets/devicesicons/realme-seeklogo.png",
};

const CATEGORY = "television";

export default function SellTelevisions() {
  const navigate = useNavigate();
  const { setCategory, setSelectedBrand } = useSellFlow();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  if (user?.role === "seller") {
    return <SellerCannotSellPage />;
  }

  useEffect(() => {
    setCategory(CATEGORY);
    getBrands(CATEGORY)
      .then((res) => setBrands(res.data)) // res.data = ["Apple", "Samsung", …]
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleBrandClick = (brand) => {
    setSelectedBrand(brand);
    navigate(`/sell/${CATEGORY}/${encodeURIComponent(brand)}`);
  };

  return (
    <>
      {/* ── Hero / search card ── */}
      <SellCard
        title="Sell Old Televisions for Instant Cash"
        brands={brands}
        brandsLoading={loading}
        brandsError={error}
        onBrandClick={handleBrandClick}
      />

      <Feedback />
      <FAQ />
      <DownloadAppBanner />
      <Footer />
    </>
  );
}
