// src/pages/sell/SellPhones.jsx
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

const CATEGORY = "mobile";

export default function SellPhones() {
  const navigate = useNavigate();
  const { setCategory, setSelectedBrand } = useSellFlow();

  const [brands, setBrands]       = useState([]);
  const [brandLogos, setBrandLogos] = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const { user } = useAuth();

  if (user?.role === "seller") {
  return <SellerCannotSellPage />;
}

  useEffect(() => {
    setCategory(CATEGORY);
    getBrands(CATEGORY)
      .then((res) => {
        // res.data is now [{ brand, logo }, ...]
        const names = res.data.map((b) => b.brand);
        const logos = Object.fromEntries(
          res.data
            .filter((b) => b.logo)
            .map((b) => [b.brand, b.logo])
        );
        setBrands(names);
        setBrandLogos(logos);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleBrandClick = (brand) => {
    setSelectedBrand(brand);
    navigate(`/sell/${CATEGORY}/${encodeURIComponent(brand)}`);
  };

  return (
    <>
      <SellCard
        title="Sell Old Mobile Phone for Instant Cash"
        brands={brands}
        brandLogos={brandLogos}
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