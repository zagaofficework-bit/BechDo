// constants/deviceSell.constants.js
// Defines what spec fields each category uses for variants.
// Used by: getVariantFields endpoint, calculatePrice, submitListing, addBrandCatalog

const VARIANT_FIELDS_MAP = {
  mobile: [
    { key: "ram",     label: "RAM",     unit: "GB", required: false },
    { key: "storage", label: "Storage", unit: "GB", required: true  },
  ],
  tablet: [
    { key: "ram",        label: "RAM",         unit: "GB", required: false },
    { key: "storage",    label: "Storage",     unit: "GB", required: true  },
    { key: "cellularSupport", label: "Cellular", unit: null, required: false },
  ],
  laptop: [
    { key: "ram",       label: "RAM",       unit: "GB",  required: true  },
    { key: "storage",   label: "Storage",   unit: "GB",  required: true  },
    { key: "processor", label: "Processor", unit: null,  required: true  },
  ],
  smartwatch: [
    { key: "caseSize",     label: "Case Size",    unit: "mm", required: true  },
    { key: "connectivity", label: "Connectivity", unit: null, required: false },
  ],
  television: [
    { key: "screenSize",  label: "Screen Size",  unit: "inch", required: true  },
    { key: "resolution",  label: "Resolution",   unit: null,   required: true  },
    { key: "displayType", label: "Display Type", unit: null,   required: false },
  ],
};

// Returns a human-readable variant label like "8GB / 256GB / i5-12th"
function buildVariantLabel(specs, category) {
  const fields = VARIANT_FIELDS_MAP[category] || [];
  return fields
    .filter((f) => specs?.[f.key])
    .map((f) => {
      const val = specs[f.key];
      return f.unit ? `${val} ${f.unit}` : val;
    })
    .join(" / ");
}

module.exports = { VARIANT_FIELDS_MAP, buildVariantLabel };