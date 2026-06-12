// src/features/Admin/components/CatalogManager.jsx
// Drop into AdminDashboard: add "catalog" to NAV + render <CatalogManager /> in the tab section

import { useState, useEffect, useRef, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const CATEGORIES = ["mobile", "laptop", "tablet", "smartwatch", "television"];

const token = () => localStorage.getItem("accessToken");

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token()}`, ...opts.headers },
    ...opts,
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message || "Request failed");
  return d;
}

async function apiMultipart(path, fd, method = "POST") {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token()}` },
    body: fd,
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message || "Request failed");
  return d;
}

// ─── variant field definitions per category ───────────────────────────────────
const VARIANT_FIELDS = {
  mobile:      [{ key: "ram", label: "RAM", ph: "8 GB" }, { key: "storage", label: "Storage", ph: "128 GB" }],
  laptop:      [{ key: "ram", label: "RAM", ph: "16 GB" }, { key: "storage", label: "Storage", ph: "512 GB SSD" }],
  tablet:      [{ key: "ram", label: "RAM", ph: "4 GB" }, { key: "storage", label: "Storage", ph: "64 GB" }, { key: "connectivity", label: "Connectivity", ph: "Wi-Fi Only" }],
  smartwatch:  [{ key: "caseSize", label: "Case Size", ph: "44mm" }, { key: "connectivity", label: "Connectivity", ph: "GPS Only" }],
  television:  [{ key: "screenSize", label: "Screen Size", ph: "55\"" }, { key: "resolution", label: "Resolution", ph: "4K UHD" }],
};

const BLUE = "#1132d4";

// ─── small helpers ────────────────────────────────────────────────────────────
const Spinner = ({ size = 16 }) => (
  <span style={{ display: "inline-block", width: size, height: size, border: "2px solid #e2e8f0", borderTopColor: BLUE, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
);

const Badge = ({ label, color = "#e8f0fe", text = BLUE }) => (
  <span style={{ background: color, color: text, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "capitalize", letterSpacing: "0.04em" }}>{label}</span>
);

// ─── Variant editor ────────────────────────────────────────────────────────────
function VariantEditor({ category, variants, onChange }) {
  const fields = VARIANT_FIELDS[category] || [{ key: "spec", label: "Spec", ph: "" }];

  const addVariant = () => onChange([...variants, { specs: {}, basePrice: 0 }]);
  const removeVariant = (i) => onChange(variants.filter((_, idx) => idx !== i));
  const updateSpec = (i, key, val) => {
    const v = [...variants];
    v[i] = { ...v[i], specs: { ...v[i].specs, [key]: val } };
    onChange(v);
  };
  const updatePrice = (i, val) => {
    const v = [...variants];
    v[i] = { ...v[i], basePrice: parseInt(val) || 0 };
    onChange(v);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Variants</span>
        <button type="button" onClick={addVariant} style={{ fontSize: 11, fontWeight: 700, color: BLUE, background: "#e8f0fe", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>+ Add</button>
      </div>
      {variants.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>No variants yet — click Add</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {variants.map((v, i) => (
          <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              {fields.map((f) => (
                <div key={f.key} style={{ flex: "1 1 80px" }}>
                  <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 2 }}>{f.label}</label>
                  <input
                    value={v.specs?.[f.key] || ""}
                    onChange={(e) => updateSpec(i, f.key, e.target.value)}
                    placeholder={f.ph}
                    style={{ width: "100%", fontSize: 12, padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div style={{ flex: "1 1 80px" }}>
                <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 2 }}>Base Price ₹</label>
                <input
                  type="number"
                  value={v.basePrice || ""}
                  onChange={(e) => updatePrice(i, e.target.value)}
                  placeholder="15000"
                  style={{ width: "100%", fontSize: 12, padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <button type="button" onClick={() => removeVariant(i)} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>✕ Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Model form modal ─────────────────────────────────────────────────────────
function ModelModal({ catalog, model, onClose, onSaved, showToast }) {
  const isEdit = !!model;
  const [name, setName]         = useState(model?.name || "");
  const [variants, setVariants] = useState(model?.variants || []);
  const [imgFile, setImgFile]   = useState(null);
  const [imgPreview, setImgPreview] = useState(model?.image || null);
  const [saving, setSaving]     = useState(false);
  const fileRef = useRef();

  const handleSave = async () => {
    if (!name.trim()) { showToast("Model name required", "error"); return; }
    if (variants.length === 0) { showToast("Add at least one variant", "error"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("brand", catalog.brand);
      fd.append("category", catalog.category);
      fd.append("modelName", name.trim());
      fd.append("variants", JSON.stringify(variants));
      if (isEdit) fd.append("modelId", model._id);
      if (imgFile) fd.append("image", imgFile);
      else if (imgPreview) fd.append("existingImage", imgPreview);

      await apiMultipart("/device-sell/admin/catalog/model", fd);
      showToast(isEdit ? "Model updated" : "Model added");
      onSaved();
      onClose();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>{isEdit ? "Edit Model" : "Add Model"}</p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{catalog.brand} · <span style={{ textTransform: "capitalize" }}>{catalog.category}</span></p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14, color: "#64748b" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Model name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Model Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. iPhone 16 Pro"
              style={{ width: "100%", fontSize: 14, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, outline: "none", boxSizing: "border-box" }}
              onFocus={(e) => (e.target.style.borderColor = BLUE)}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Image upload */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Model Image</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {imgPreview
                ? <img src={imgPreview} alt="" style={{ width: 56, height: 72, objectFit: "contain", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc" }} />
                : <div style={{ width: 56, height: 72, borderRadius: 8, border: "1.5px dashed #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📷</div>
              }
              <div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ fontSize: 12, fontWeight: 600, color: BLUE, background: "#e8f0fe", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                  {imgPreview ? "Change Image" : "Upload Image"}
                </button>
                {imgPreview && <button type="button" onClick={() => { setImgFile(null); setImgPreview(null); }} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", marginLeft: 8 }}>Remove</button>}
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>PNG, JPG up to 5MB</p>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)); } }} />
              </div>
            </div>
          </div>

          {/* Variants */}
          <VariantEditor category={catalog.category} variants={variants} onChange={setVariants} />
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: saving ? "#e2e8f0" : BLUE, color: saving ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {saving && <Spinner size={14} />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Model"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Brand row (expandable) ────────────────────────────────────────────────────
function CatalogRow({ catalog, onEdit, onDelete, onDeleteModel, showToast, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [modelModal, setModelModal] = useState(null); // null | "new" | model obj

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
      {/* Brand header */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", userSelect: "none" }}
      >
        {catalog.logo
          ? <img src={catalog.logo} alt={catalog.brand} style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 8, border: "1px solid #f1f5f9" }} />
          : <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📱</div>
        }
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{catalog.brand}</p>
          <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>{catalog.models?.length || 0} models</p>
        </div>
        <Badge label={catalog.category} />
        <button onClick={(e) => { e.stopPropagation(); setModelModal("new"); }}
          style={{ fontSize: 11, fontWeight: 700, color: BLUE, background: "#e8f0fe", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", marginLeft: 4 }}>+ Model</button>
        <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete entire ${catalog.brand} ${catalog.category} catalog?`)) onDelete(catalog.brand, catalog.category); }}
          style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fef2f2", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>Delete</button>
        <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>{open ? "▲" : "▼"}</span>
      </div>

      {/* Models list */}
      {open && (
        <div style={{ borderTop: "1px solid #f1f5f9" }}>
          {(!catalog.models || catalog.models.length === 0) && (
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>No models — click + Model to add</p>
          )}
          {catalog.models?.map((m) => (
            <div key={m._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid #f8fafc" }}>
              {m.image
                ? <img src={m.image} alt={m.name} style={{ width: 32, height: 40, objectFit: "contain", borderRadius: 6, border: "1px solid #f1f5f9", flexShrink: 0 }} />
                : <div style={{ width: 32, height: 40, borderRadius: 6, background: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📦</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{m.variants?.length || 0} variants · {m.soldCount || 0} sold</p>
              </div>
              <button onClick={() => setModelModal(m)}
                style={{ fontSize: 11, color: BLUE, background: "#e8f0fe", border: "none", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>Edit</button>
              <button onClick={() => { if (window.confirm(`Delete "${m.name}"?`)) onDeleteModel(catalog.brand, catalog.category, m._id); }}
                style={{ fontSize: 11, color: "#ef4444", background: "#fef2f2", border: "none", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>Del</button>
            </div>
          ))}
        </div>
      )}

      {/* Model modal */}
      {modelModal && (
        <ModelModal
          catalog={catalog}
          model={modelModal === "new" ? null : modelModal}
          onClose={() => setModelModal(null)}
          onSaved={onRefresh}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─── Main CatalogManager ──────────────────────────────────────────────────────
export default function CatalogManager({ showToast }) {
  const [catalogs, setCatalogs]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({});
  const [addBrandModal, setAddBrandModal] = useState(false);
  const [newBrand, setNewBrand]   = useState({ brand: "", category: "mobile" });
  const [creating, setCreating]   = useState(false);

  const fetchCatalogs = useCallback(async (p = 1) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (catFilter !== "all") params.set("category", catFilter);
      if (search.trim()) params.set("brand", search.trim());
      const res = await apiFetch(`/device-sell/admin/catalogs?${params}`);
      setCatalogs(res.data);
      setPagination(res.pagination);
      setPage(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [catFilter, search]);

  useEffect(() => { fetchCatalogs(1); }, [catFilter]);

  const handleSearch = (e) => { if (e.key === "Enter") fetchCatalogs(1); };

  const handleDeleteCatalog = async (brand, category) => {
    try {
      await apiFetch(`/device-sell/admin/catalog/${encodeURIComponent(brand)}/${category}`, { method: "DELETE" });
      showToast(`${brand} ${category} deleted`);
      fetchCatalogs(page);
    } catch (e) { showToast(e.message, "error"); }
  };

  const handleDeleteModel = async (brand, category, modelId) => {
    try {
      await apiFetch(`/device-sell/admin/catalog/${encodeURIComponent(brand)}/${category}/models/${modelId}`, { method: "DELETE" });
      showToast("Model deleted");
      fetchCatalogs(page);
    } catch (e) { showToast(e.message, "error"); }
  };

  const handleCreateBrand = async () => {
    if (!newBrand.brand.trim()) { showToast("Brand name required", "error"); return; }
    setCreating(true);
    try {
      await apiFetch("/device-sell/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: newBrand.brand.trim(), category: newBrand.category, models: [] }),
      });
      showToast(`${newBrand.brand} catalog created`);
      setAddBrandModal(false);
      setNewBrand({ brand: "", category: "mobile" });
      fetchCatalogs(1);
    } catch (e) { showToast(e.message, "error"); }
    finally { setCreating(false); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Device Catalog</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Manage brands, models and variants for the sell flow</p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        {/* Search */}
        <div style={{ flex: "1 1 180px", display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "8px 12px" }}>
          <span style={{ color: "#94a3b8", fontSize: 14 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search brand… (Enter)"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#0f172a", background: "transparent" }}
          />
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 99, border: "1.5px solid", cursor: "pointer", transition: "all .15s", textTransform: "capitalize",
                background: catFilter === c ? BLUE : "#fff",
                color: catFilter === c ? "#fff" : "#64748b",
                borderColor: catFilter === c ? BLUE : "#e2e8f0",
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Add brand */}
        <button onClick={() => setAddBrandModal(true)}
          style={{ fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 10, border: "none", background: BLUE, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          + Add Brand
        </button>
      </div>

      {/* Error */}
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14 }}>⚠ {error}</div>}

      {/* Stats */}
      {!loading && (
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
          {pagination.total || 0} brand{pagination.total !== 1 ? "s" : ""} · page {pagination.page || 1} of {pagination.totalPages || 1}
        </p>
      )}

      {/* Catalog list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 64, background: "#f8fafc", borderRadius: 14, animation: "pulse 1.5s ease infinite" }} />
          ))}
        </div>
      ) : catalogs.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📦</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>No catalogs found</p>
          <p style={{ fontSize: 12, color: "#94a3b8" }}>Add a brand to get started</p>
        </div>
      ) : (
        catalogs.map((c) => (
          <CatalogRow
            key={`${c.brand}-${c.category}`}
            catalog={c}
            onDelete={handleDeleteCatalog}
            onDeleteModel={handleDeleteModel}
            showToast={showToast}
            onRefresh={() => fetchCatalogs(page)}
          />
        ))
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <button disabled={!pagination.hasPrev} onClick={() => fetchCatalogs(page - 1)}
            style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: pagination.hasPrev ? "pointer" : "not-allowed", opacity: pagination.hasPrev ? 1 : 0.4 }}>← Prev</button>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Page {page} of {pagination.totalPages}</span>
          <button disabled={!pagination.hasNext} onClick={() => fetchCatalogs(page + 1)}
            style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: pagination.hasNext ? "pointer" : "not-allowed", opacity: pagination.hasNext ? 1 : 0.4 }}>Next →</button>
        </div>
      )}

      {/* Add Brand Modal */}
      {addBrandModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setAddBrandModal(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Add Brand Catalog</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Brand Name *</label>
              <input
                value={newBrand.brand}
                onChange={(e) => setNewBrand((p) => ({ ...p, brand: e.target.value }))}
                placeholder="e.g. Apple, Samsung"
                style={{ width: "100%", fontSize: 14, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => (e.target.style.borderColor = BLUE)}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Category *</label>
              <select
                value={newBrand.category}
                onChange={(e) => setNewBrand((p) => ({ ...p, category: e.target.value }))}
                style={{ width: "100%", fontSize: 14, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, outline: "none", boxSizing: "border-box", background: "#fff" }}>
                {CATEGORIES.map((c) => <option key={c} value={c} style={{ textTransform: "capitalize" }}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setAddBrandModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreateBrand} disabled={creating}
                style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: creating ? "#e2e8f0" : BLUE, color: creating ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {creating && <Spinner size={14} />}
                {creating ? "Creating…" : "Create Catalog"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}