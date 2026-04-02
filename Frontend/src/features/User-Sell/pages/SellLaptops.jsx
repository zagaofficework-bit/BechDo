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

// Brand logo map — add more as needed
const BRAND_LOGOS = {
  Apple:   "./assets/img/AppleLogo.png",
  Samsung: "./assets/img/SamsungLogo.png",
  Xiaomi:  "./assets/img/XiaomiLogo.png",
  Vivo:    "./assets/img/VivoLogo.png",
  Oppo:    "./assets/img/OppoLogo.png",
  OnePlus: "./assets/img/OnePlusLogo.png",
  Realme:  "./assets/img/RealmeLogo.png",
};

const CATEGORY = "laptop"; // change to "laptop" | "tablet" etc. per page

export default function SellLaptops() {
  const navigate = useNavigate();
  const { setCategory, setSelectedBrand } = useSellFlow();

  const [brands, setBrands]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setCategory(CATEGORY);
    getBrands(CATEGORY)
      .then((res) => setBrands(res.data))   // res.data = ["Apple", "Samsung", …]
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
        title="Sell Old Laptop for Instant Cash"
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