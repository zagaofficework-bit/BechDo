// src/context/SellFlowContext.jsx
//
// Wraps the entire sell flow (SelectModel → Submit).
// Each step reads/writes via useSellFlow().
//
import { createContext, useContext, useState } from "react";

const SellFlowContext = createContext(null);

export function SellFlowProvider({ children }) {
  // ── Catalog selection ───────────────────────────────────────────
  const [category, setCategory] = useState("mobile"); // "mobile" | "laptop" | …
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null); // { id, name, image, soldCount }
  const [selectedVariant, setSelectedVariant] = useState(null); // { id, ram, storage, label, basePrice }
  const [selectedDefectGroups, setSelectedDefectGroups] = useState([]);

  // ── Evaluation answers ──────────────────────────────────────────
  const [answers, setAnswers] = useState({}); // { [question.key]: true|false }
  const [defectKeys, setDefectKeys] = useState([]); // string[]
  const [accessoryKeys, setAccessoryKeys] = useState([]); // string[]

  // ── Calculated price (from /calculate) ─────────────────────────
  const [priceData, setPriceData] = useState(null);

  // ── Reset whole flow ────────────────────────────────────────────
  const resetFlow = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedVariant(null);
    setAnswers({});
    setDefectKeys([]);
    setAccessoryKeys([]);
    setPriceData(null);
  };

  return (
    <SellFlowContext.Provider
      value={{
        category,
        setCategory,
        selectedBrand,
        setSelectedBrand,
        selectedModel,
        setSelectedModel,
        selectedVariant,
        setSelectedVariant,
        answers,
        setAnswers,
        defectKeys,
        setDefectKeys,
        accessoryKeys,
        setAccessoryKeys,
        priceData,
        setPriceData,
        resetFlow,
        selectedDefectGroups,
        setSelectedDefectGroups,
      }}
    >
      {children}
    </SellFlowContext.Provider>
  );
}

export function useSellFlow() {
  const ctx = useContext(SellFlowContext);
  if (!ctx)
    throw new Error("useSellFlow must be used inside <SellFlowProvider>");
  return ctx;
}
