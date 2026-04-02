//SelectModal

// src/pages/sell/SelectModel.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SellDevices from "../pages/SellDevices";
import { getModelsByBrand } from "../../../services/deviceSell.api";
import { useSellFlow } from "../../../context/sellflow.context";
import { useNavigate } from "react-router-dom";

export default function SelectModel() {
  const { category = "mobile", brand = "Apple" } = useParams();
  const { setCategory, setSelectedBrand } = useSellFlow();

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCategory(category);
    setSelectedBrand(brand);
    getModelsByBrand(brand, category)
      .then((res) => setModels(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [brand, category]);

  
  return (
    <div>
      
      {loading && (
        <div className="flex items-center justify-center py-24 text-gray-400">
          Loading models…
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center py-24 text-red-500">
          {error}
        </div>
      )}
      {!loading && !error && (
        <SellDevices models={models} brand={brand} category={category} />
      )}
    </div>
  );
}
